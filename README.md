# 🤖 GenAI Debugging Assistant for AWS

## Overview

The GenAI Debugging Assistant is an innovative AI-powered tool designed to help L1 support staff efficiently debug and manage AWS infrastructure. By leveraging AWS APIs and Anthropic's Claude model via AWS Bedrock, this assistant provides real-time insights, log retrieval, and intelligent troubleshooting recommendations.

![image](https://github.com/user-attachments/assets/a6009d1f-b43a-4566-9882-026a4edce15a)


## 🌟 Key Features

- **AWS Data Retrieval**: 
  - Fetch logs from CloudWatch and Lambda
  - Retrieve metrics from CloudWatch
  - Describe EC2 and RDS resources

- **Intelligent Side Panel UI**:
  - Displays raw data and AI-generated explanations
  - Provides context for debugging sessions

- **Session Management**:
  - Store and resume past debugging conversations
  - Maintain context across interactions

- **AI-Powered Assistance**:
  - Uses Claude 3.5 Sonnet via AWS Bedrock
  - Delivers friendly, actionable debugging advice

## 🚀 Prerequisites

### Software Requirements
- Node.js (v16+)
- npm
- Python 3.8+
- Git

### AWS Requirements
- AWS Account
- IAM permissions for:
  - Lambda
  - DynamoDB
  - CloudWatch Logs
  - EC2
  - RDS
  - S3
  - ELBv2
  - Bedrock

## 📦 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/genai-aws-debugger.git
cd genai-aws-debugger
```

### 2. Set Up AWS Resources

#### Create DynamoDB Tables
```bash
aws dynamodb create-table --table-name DebuggingSessions \
  --attribute-definitions AttributeName=session_id,AttributeType=S \
  --key-schema AttributeName=session_id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST --region <your-region>
```

#### IAM Role Configuration
- Create `GenAIDebuggingRole`
- Attach policies:
  - AWSLambdaBasicExecutionRole
  - AmazonDynamoDBFullAccess
  - AmazonBedrockFullAccess
  - Custom AWS service permissions

### 3. Configure Lambda Function
- Create `MainLambda` function
- Runtime: Python 3.9
- Handler: `lambda_function.lambda_handler`
- Set environment variables:
  - `YOUR_REGION_NAME`
  - `YOUR_AWS_ACCESS_KEY_ID`
  - `YOUR_AWS_SECRET_ACCESS_KEY`
  - `ADITYA_AWS_ACCESS_KEY_ID`
  - `ADITYA_AWS_SECRET_ACCESS_KEY`

### 4. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your AWS and backend configurations
npm run dev
```

## 🔧 Configuration

Modify `.env` with your specific AWS and backend settings:

```bash
VITE_AWS_REGION=ap-south-1
VITE_AWS_ACCESS_KEY_ID=your-access-key
VITE_AWS_SECRET_ACCESS_KEY=your-secret-key
VITE_AWS_LAMBDA_FUNCTION_NAME=MainLambda
VITE_BACKEND_URL=https://your-api-gateway-url
```

## 🛠 Tools and Technologies

- **Frontend**: React, Tailwind CSS
- **Backend**: AWS Lambda, Python
- **AI**: Claude 3.5 Sonnet (AWS Bedrock)
- **Database**: DynamoDB
- **Authentication**: Custom backend (optional)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



## 🙏 Acknowledgements

- [Anthropic](https://www.anthropic.com) for Claude AI
- [AWS](https://aws.amazon.com) for cloud services
- [React](https://reactjs.org) community
