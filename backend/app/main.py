from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import boto3
import os
from dotenv import load_dotenv
import httpx
import json
from datetime import datetime, timedelta
import time
import base64
import uuid
from io import BytesIO
from PIL import Image
import logging
from collections import defaultdict
import re

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Automatic Image Titling API")

@app.get('/favicon.ico', include_in_schema=False)
async def favicon():
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.get('/health')
async def health_check():
    """Health check endpoint for App Runner."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Automatic Image Titling API"
    }

# Rate limiting configuration
RATE_LIMIT = 5  # requests per minute
rate_limit_store = defaultdict(list)

# In-memory analytics store
analytics = {
    'total_invocations': 0,
    'successful_invocations': 0,
    'failed_invocations': 0,
    'processing_times': []
}

def check_rate_limit(client_id: str) -> bool:
    """Check if the client has exceeded the rate limit."""
    now = datetime.utcnow()
    minute_ago = now - timedelta(minutes=1)
    
    # Clean old requests
    rate_limit_store[client_id] = [t for t in rate_limit_store[client_id] if t > minute_ago]
    
    # Check if limit exceeded
    if len(rate_limit_store[client_id]) >= RATE_LIMIT:
        return False
    
    # Add new request
    rate_limit_store[client_id].append(now)
    return True

def is_safe_image(image: Image.Image) -> bool:
    """Check if the image is safe for processing."""
    # Only check for inappropriate content
    return True

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AWS clients
try:
    # Try to use profile first (for local development)
    session = boto3.Session(profile_name='default')
except:
    # Fall back to IAM role (for AWS deployment)
    session = boto3.Session()
    
# Get the AWS region from environment variables, defaulting to us-east-1.
region_name = os.getenv('AWS_REGION', 'us-east-1')

s3_client = session.client('s3', region_name=region_name)
bedrock_runtime = session.client(
    service_name='bedrock-runtime',
    region_name=region_name
)
cloudwatch = session.client('cloudwatch', region_name=region_name)

# Hugging Face Inference API Configuration
HUGGING_FACE_API_BASE = "https://api-inference.huggingface.co/models/"
HUGGING_FACE_TOKEN = os.getenv("HF_API_TOKEN")

# Initialize httpx client for async HTTP requests
httpx_client = httpx.AsyncClient(headers={
    "Authorization": f"Bearer {HUGGING_FACE_TOKEN}"
}) if HUGGING_FACE_TOKEN else None

# Constants
MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0'
METRIC_NAMESPACE = 'ImageCaptioner/BedrockMetrics'

class ImageTitle(BaseModel):
    image_id: str
    image_name: str
    title: str
    confidence: float
    processing_time: float
    timestamp: str
    metadata: Dict[str, Any] = {}

def put_metric(metric_name: str, value: float, unit: str = 'Count', dimensions: dict = None):
    """Put a metric to CloudWatch."""
    try:
        cloudwatch.put_metric_data(
            Namespace=METRIC_NAMESPACE,
            MetricData=[{
                'MetricName': metric_name,
                'Value': value,
                'Unit': unit,
                'Dimensions': [
                    {'Name': 'ModelId', 'Value': MODEL_ID},
                    *(dimensions or {}).items()
                ],
                'Timestamp': datetime.utcnow()
            }]
        )
    except Exception as e:
        logger.error(f"Error putting metric {metric_name}: {str(e)}")

def encode_image_to_base64(image: Image.Image) -> str:
    """Convert PIL Image to base64 string."""
    buffered = BytesIO()
    image.save(buffered, format="JPEG")
    return base64.b64encode(buffered.getvalue()).decode('utf-8')

def generate_image_title(image_base64: str) -> dict:
    """Generate title for image using Claude 3 Sonnet."""
    prompt = """Analyze this image and generate a concise, descriptive title. 
    The title should be creative yet accurate, capturing the main subject and mood of the image.
    Format the response as a JSON object with the following structure:
    {
        "title": "The generated title",
        "confidence": 0.95,  // A number between 0 and 1 indicating confidence
        "explanation": "Brief explanation of why this title was chosen"
    }"""

    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 200,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    },
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": image_base64
                        }
                    }
                ]
            }
        ]
    }

    start_time = time.time()
    try:
        # Track model invocation
        put_metric('ModelInvocations', 1)
        
        response = bedrock_runtime.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps(body)
        )
        
        # Track latency
        latency = time.time() - start_time
        put_metric('InvocationLatency', latency, unit='Seconds')
        
        response_body = json.loads(response['body'].read())
        return json.loads(response_body['content'][0]['text'])
    except bedrock_runtime.exceptions.ThrottlingException:
        put_metric('Throttles', 1)
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    except bedrock_runtime.exceptions.ClientError as e:
        put_metric('ClientErrors', 1)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        put_metric('ServerErrors', 1)
        logger.error(f"Error generating title: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating title: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Automatic Image Titling API is running"}

@app.get("/metrics")
async def get_metrics():
    """Get in-memory analytics for performance dashboard."""
    try:
        total = analytics['total_invocations']
        success = analytics['successful_invocations']
        failed = analytics['failed_invocations']
        times = analytics['processing_times']
        avg_time = sum(times) / len(times) if times else 0
        success_rate = (success / total) * 100 if total > 0 else 0
        return {
            'model_invocations': total,
            'successful_invocations': success,
            'failed_invocations': failed,
            'avg_processing_time': avg_time,
            'processing_times': times[-20:],  # last 20 for graph
            'success_rate': success_rate,
            'total_images': success,
        }
    except Exception as e:
        logger.error(f"Error fetching metrics: {str(e)}")
        return {
            'model_invocations': 0,
            'successful_invocations': 0,
            'failed_invocations': 0,
            'avg_processing_time': 0,
            'processing_times': [],
            'success_rate': 0,
            'total_images': 0,
        }

@app.post("/analyze-image")
async def analyze_image(request: Request, file: UploadFile = File(...)):
    """Process uploaded image and generate title."""
    client_id = request.client.host
    if not check_rate_limit(client_id):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again in a minute."
        )
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    try:
        analytics['total_invocations'] += 1
        contents = await file.read()
        image = Image.open(BytesIO(contents))
        if not is_safe_image(image):
            analytics['failed_invocations'] += 1
            raise HTTPException(
                status_code=400,
                detail="Image must be less than 5MB and dimensions must not exceed 4096x4096"
            )
        image_base64 = encode_image_to_base64(image)
        start_time = time.time()
        result = generate_image_title(image_base64)
        processing_time = time.time() - start_time
        analytics['processing_times'].append(processing_time)
        # Check for inappropriate content in the title
        inappropriate_keywords = ['nude', 'naked', 'explicit', 'porn', 'adult', 'nsfw']
        title_lower = result['title'].lower()
        if any(keyword in title_lower for keyword in inappropriate_keywords):
            analytics['failed_invocations'] += 1
            raise HTTPException(
                status_code=400,
                detail="Image content appears to be inappropriate"
            )
        analytics['successful_invocations'] += 1
        timestamp = int(time.time())
        s3_key = f"images/{timestamp}_{file.filename}"
        s3_client.put_object(
            Bucket=os.getenv('S3_BUCKET_NAME'),
            Key=s3_key,
            Body=contents,
            ContentType=file.content_type,
            Metadata={
                'title': result['title'],
                'confidence': str(result['confidence']),
                'timestamp': str(timestamp)
            }
        )
        return {
            "title": result['title'],
            "confidence": result['confidence'],
            "explanation": result['explanation'],
            "processing_time": processing_time,
            "timestamp": timestamp,
            "s3_key": s3_key
        }
    except HTTPException:
        raise
    except Exception as e:
        analytics['failed_invocations'] += 1
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080) 