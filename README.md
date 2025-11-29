# MyRSSPress

Transform RSS feeds into visually appealing newspaper-style layouts with AI-powered curation.

## Overview

MyRSSPress is a web application that converts RSS feeds into beautiful, newspaper-style digital layouts. Users input topics of interest, receive AI-driven RSS feed suggestions, select feeds, and generate personalized digital newspapers with realistic paper textures and intelligent article layouts.

## Features

- **AI-Powered Feed Suggestions**: Get relevant RSS feed recommendations using AWS Bedrock (Claude 3.5 Haiku)
- **Newspaper-Style Layout**: Articles displayed with authentic newspaper design and paper textures
- **Intelligent Article Ranking**: AI-based importance calculation for optimal article placement
- **Multi-language Support**: Interface available in Japanese and English
- **Public Newspaper Gallery**: Browse and discover newspapers created by other users
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

## Technology Stack

### Frontend
- Next.js 15.x (App Router)
- TypeScript 5.9.x
- Tailwind CSS 3.x
- AWS Amplify Hosting

### Backend
- AWS Lambda (Node.js 24.x LTS)
- Hono 4.x Framework
- TypeScript 5.9.x
- AWS Bedrock (Claude 3.5 Haiku)
- DynamoDB

### Infrastructure
- Terraform 1.10.x
- AWS API Gateway
- Amazon ECR
- CloudFront CDN
- Route53

## Project Structure

```
myrsspress/
├── frontend/          # Next.js frontend application
├── backend/           # Lambda + Hono backend
├── infra/             # Terraform infrastructure code
├── prototype/         # Prototype implementation
├── scripts/           # Utility scripts
└── .kiro/             # Kiro specs and configuration
```

## Getting Started

### Prerequisites

Required tools and versions are defined in `.tool-versions`:
- Node.js 24.x LTS (or 22.x LTS)
- Terraform >= 1.10.0
- AWS CLI >= 2.0
- Docker >= 20.0
- Gitleaks (for security checks)

### Tool Installation

**Option 1: Using asdf (Recommended)**
```bash
# Install asdf (if not already installed)
# macOS: brew install asdf
# Linux: https://asdf-vm.com/guide/getting-started.html

# Install tools from .tool-versions
make install-tools
```

**Option 2: Manual Installation**
```bash
# Check which tools are missing
make check-tools

# Install tools individually:
# - Node.js: https://nodejs.org/
# - Terraform: https://www.terraform.io/downloads.html
# - AWS CLI: https://aws.amazon.com/cli/
# - Docker: https://www.docker.com/get-started
# - Gitleaks: https://github.com/gitleaks/gitleaks
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kumagaias/my-rss-press.git
cd my-rss-press
```

2. Check required tools:
```bash
make check-tools
```

3. Install dependencies:
```bash
make install
```

### Development

#### Frontend Development
```bash
cd frontend
npm run dev
# Open http://localhost:3000
```

#### Backend Development
```bash
cd backend
npm run dev
# Server runs at http://localhost:3001
```

### Testing

Run all tests:
```bash
make test
```

Run unit tests only:
```bash
make test-unit
```

Run security checks:
```bash
make security-check
```

### Deployment

#### Infrastructure Setup
```bash
cd infra/environments/production
terraform init
terraform plan
terraform apply
```

#### Backend Deployment
Push to main branch triggers automatic deployment via GitHub Actions:
```bash
git push origin main
```

#### Frontend Deployment
Amplify automatically deploys on push to main:
```bash
git push origin main
```

## Architecture

```
User Browser
    ↓
CloudFront (CDN)
    ↓
AWS Amplify (Next.js)
    ↓
API Gateway
    ↓
Lambda (Hono)
    ↓
├── AWS Bedrock (AI)
├── RSS Feeds (External)
└── DynamoDB (Storage)
```

## Configuration

### Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_BASE_URL=https://api.my-rss-press.com
NEXT_PUBLIC_APP_ENV=production
```

**Backend (.env.local):**
```
BEDROCK_REGION=ap-northeast-1
DYNAMODB_TABLE=newspapers-production
NODE_ENV=development
```

## Contributing

1. Create a feature branch: `git checkout -b feat/task-X.X-description`
2. Make your changes and test locally
3. Run tests: `make test`
4. Commit: `git commit -m "feat: description (task-X.X)"`
5. Push: `git push origin feat/task-X.X-description`
6. Create a Pull Request

## License

[Your License Here]

## Contact

[Your Contact Information]
