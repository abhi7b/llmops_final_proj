# Automatic Image Titling Application

An AI-powered application that generates descriptive titles for uploaded images using AWS Bedrock and Hugging Face models.

## Features

- Image upload and processing
- AI-powered title generation
- Real-time performance analytics dashboard
- Secure file handling
- Rate limiting and content safety

## Performance Analytics

The application provides a real-time dashboard with the following metrics:
- **Model Invokes:** Total number of model invocation calls (success + failed)
- **Success Rate:** Percentage and count of successfully processed images
- **Average Latency:** Average time to process and generate titles for images
- **Total Images:** Number of successfully processed images
- **Failure Count:** Number of failed invocations (shown in analytics graphs)
- **Live Graphs:** Visualize recent processing times, success/failure rates, and invocation counts

## Architecture Design and Implementation

### High-Level Architecture

- **Frontend:** React + Material-UI, communicates with backend via REST API
- **Backend:** FastAPI (Python), handles image upload, invokes AWS Bedrock, manages analytics, and enforces security
- **AWS Bedrock:** Used for image captioning/model inference
- **S3:** Stores uploaded images and metadata
- **In-memory Analytics:** Backend tracks invocations, successes, failures, and processing times for real-time analytics

### Implementation Details

- **Frontend:**
  - Modern, responsive UI with drag-and-drop image upload
  - Displays generated title, confidence score, and explanation
  - Real-time analytics dashboard with charts (Chart.js)
  - Security features highlighted for transparency
- **Backend:**
  - FastAPI endpoints for image analysis and metrics
  - In-memory analytics store for fast, live dashboard updates
  - Rate limiting and inappropriate content filtering
  - S3 integration for image storage
  - AWS Bedrock integration for model inference

### Architecture Diagram

```
User ──▶ [React Frontend] ──▶ [FastAPI Backend] ──▶ [AWS Bedrock Model]
         │                        │
         │                        └──▶ [S3 Storage]
         │
         └──▶ [Performance Analytics Dashboard]
```

## API Documentation

### POST `/analyze-image`
- **Description:** Upload an image and receive a generated title, confidence score, and explanation.
- **Request:**
  - `file`: Image file (JPEG, PNG, GIF)
- **Response:**
  - `title`: Generated title (string)
  - `confidence`: Confidence score (float, 0-1)
  - `explanation`: Explanation for the title (string)
  - `processing_time`: Time taken to process (float, seconds)
  - `timestamp`: Unix timestamp
  - `s3_key`: S3 object key

### GET `/metrics`
- **Description:** Get real-time performance analytics for the dashboard.
- **Response:**
  - `model_invocations`: Total number of model invocations
  - `successful_invocations`: Number of successful invocations
  - `failed_invocations`: Number of failed invocations
  - `avg_processing_time`: Average processing time (seconds)
  - `processing_times`: List of recent processing times (seconds)
  - `success_rate`: Success rate (%)
  - `total_images`: Number of successfully processed images

### GET `/`
- **Description:** Health check endpoint
- **Response:** `{ "message": "Automatic Image Titling API is running" }`

## Responsible AI Practices

- **Content Safety:**
  - Automatic detection and blocking of inappropriate content in both images and generated titles
- **Rate Limiting:**
  - Prevents abuse and ensures fair usage for all users
- **Transparency:**
  - Security features and analytics are clearly displayed in the UI
- **Data Privacy:**
  - Images are stored securely in S3 with metadata
  - No personal data is used for model training or analytics
- **Explainability:**
  - Each generated title is accompanied by a confidence score and explanation
- **Bias Mitigation:**
  - Model output is monitored for inappropriate or biased content
- **User Control:**
  - Users can delete their images from S3 (future feature)

## Security Features

### Rate Limiting
- Maximum 5 requests per minute per client IP
- Prevents abuse and ensures fair usage
- Automatic rate limit enforcement
- User-friendly rate limit messages

### Content Safety
- Automatic detection of inappropriate content
- Keyword-based content filtering
- Safe image processing pipeline
- Clear error messages for rejected content

### File Restrictions
- Supported formats: JPEG, PNG, GIF
- File type validation

## Technical Stack

### Backend
- FastAPI
- AWS Bedrock
- AWS S3
- AWS CloudWatch
- Hugging Face Inference API

### Frontend
- React
- Material-UI
- Chart.js
- Axios

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   # Backend
   cd backend
   pip install -r requirements.txt

   # Frontend
   cd frontend
   npm install
   ```

3. Configure AWS credentials:
   - Set up AWS CLI with your credentials
   - Ensure proper IAM permissions for:
     - AWS Bedrock
     - S3
     - CloudWatch

4. Set up environment variables:
   ```bash
   # Backend (.env)
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=your-bucket-name
   HUGGINGFACE_API_KEY=your-api-key

   # Frontend (.env)
   REACT_APP_API_URL=http://localhost:8000
   ```

5. Start the application:
   ```bash
   # Backend
   cd backend
   uvicorn app.main:app --reload

   # Frontend
   cd frontend
   npm start
   ```

## API Endpoints

- `POST /analyze-image`: Upload and process an image
- `GET /metrics`: Get application metrics
- `GET /health`: Health check endpoint

## Error Handling

The application includes comprehensive error handling for:
- Rate limit exceeded
- Invalid file types
- File size limits
- Inappropriate content
- AWS service errors
- API failures


### Security Enhancements
- Added rate limiting (5 requests/minute)
- Implemented content safety checks
- Added file size and dimension restrictions
- Enhanced error handling and user feedback

### UI Improvements
- Added security features section
- Improved error messages
- Enhanced upload area design
- Added file restrictions information

### Backend Improvements
- Added request validation
- Enhanced error handling
- Improved metrics collection
- Added content filtering

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 