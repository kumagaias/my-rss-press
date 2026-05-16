# MyRSSPress

Transform RSS feeds into visually appealing newspaper-style layouts with AI-powered curation.

🌐 **Live Demo**: [https://my-rss-press.kumagaias.com/](https://my-rss-press.kumagaias.com/)

## Features

- **AI-Powered Feed Suggestions**: AWS Bedrock (Claude 3 Haiku) recommendations
- **Newspaper-Style Layout**: Authentic design with paper textures
- **Intelligent Article Ranking**: AI-based importance calculation
- **Multi-language Support**: Japanese and English
- **Public Gallery**: Browse newspapers created by others
- **Responsive Design**: Desktop, tablet, and mobile optimized

## Technology Stack

**Frontend**: Next.js 15.x, TypeScript, Tailwind CSS, AWS Amplify  
**Backend**: AWS Lambda (Node.js 24.x), Hono 4.x, DynamoDB, Bedrock  
**Infrastructure**: Terraform, API Gateway, ECR, CloudFront, Route53

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

See `.tool-versions` for required tools: Node.js 24.x, Terraform 1.11+, AWS CLI, Docker, Gitleaks

**For GitHub MCP (optional):**
```bash
brew install gh
gh auth login
```

### Quick Start

```bash
# Clone and install
git clone https://github.com/kumagaias/my-rss-press.git
cd my-rss-press
make install

# Configure environment variables (for local development)
cp frontend/.env.local.example frontend/.env.local
cp backend/.env.local.example backend/.env.local
# Edit .env.local files with your values

# Frontend development
cd frontend && npm run dev  # http://localhost:3000

# Backend development
cd backend && npm run dev   # http://localhost:3001

# Run tests
make test
```

## Deployment

**Production**: https://my-rss-press.kumagaias.com | API: https://api.my-rss-press.kumagaias.com

Automatic deployment on push to `main`:
- **Frontend**: AWS Amplify
- **Backend**: GitHub Actions → ECR → Lambda

```bash
# Infrastructure (Terraform)
cd infra/environments/production
terraform apply

# Verify deployment
./scripts/verify-production.sh
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

Environment variables: See `.env.local.example` in `frontend/` and `backend/` directories.

## Documentation

- **Specifications**: `.kiro/specs/` - Feature specifications (Phase 1, 2, 3)
- **Steering**: `.kiro/steering/` - Development guidelines and best practices
- **Hooks**: `.kiro/hooks/` - Agent automation hooks
- **Bug Reports**: `docs/bugfix/` - Detailed bug investigations and resolutions
- **Deployment**: `DEPLOYMENT-SUMMARY.md` - Deployment guide

## Contributing

1. Create feature branch: `git checkout -b feat/task-X.X-description`
2. Make changes and test: `make test`
3. Commit: `git commit -m "feat: description (task-X.X)"`
4. Push and create Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
