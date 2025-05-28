# AI-Powered Financial Compliance Assistant

A secure and scalable solution for automating financial compliance tasks using AI and cloud technologies.

## Features

- Regulatory reporting automation
- AI-powered risk assessment
- Anomaly detection in financial data
- Interactive dashboard for compliance monitoring
- Secure document management
- Real-time compliance metrics visualization

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Python FastAPI
- **AI/ML**: Amazon Bedrock
- **Workflow**: AWS Step Functions
- **Storage**: 
  - Amazon S3 (documents)
  - DynamoDB (metadata)
- **Analytics**: Amazon QuickSight
- **Security**: 
  - AWS Cognito
  - IAM
  - Encrypted storage

## Project Structure

```
.
├── frontend/                 # React frontend application
├── backend/                  # FastAPI backend service
├── infrastructure/          # AWS CDK infrastructure code
├── ml/                      # ML models and processing
├── docs/                    # Documentation
└── scripts/                 # Utility scripts
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- AWS CLI configured
- Docker

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd llmops_final_proj
```

2. Set up the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up the frontend:
```bash
cd frontend
npm install
```

4. Configure AWS credentials:
```bash
aws configure
```

### Development

1. Start the backend server:
```bash
cd backend
uvicorn main:app --reload
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

## Security

- All data is encrypted at rest and in transit
- Role-based access control (RBAC) implementation
- Regular security audits and compliance checks
- Secure API authentication using AWS Cognito


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.