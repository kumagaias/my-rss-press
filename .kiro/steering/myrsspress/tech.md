# Technical Architecture - MyRSSPress

**Related Documents:**
- [tech-common.md](./tech-common.md) - General best practices
- [structure.md](./structure.md) - Project structure
- [project-standards.md](./project-standards.md) - Project standards

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15.x (App Router)
- **Language**: TypeScript 5.9.x
- **Styling**: Tailwind CSS 3.x
- **Hosting**: AWS Amplify

### Backend
- **Runtime**: AWS Lambda (Node.js 24.x)
- **Framework**: Hono 4.x
- **Language**: TypeScript 5.9.x
- **Database**: DynamoDB
- **AI**: AWS Bedrock (Claude 3 Haiku)

### Infrastructure
- **IaC**: Terraform 1.11.x
- **CI/CD**: AWS Amplify (Frontend), GitHub Actions (Backend)
- **Region**: ap-northeast-1 (Tokyo)

## Architecture

```
User → CloudFront → Amplify (Next.js) → API Gateway → Lambda (Hono) → DynamoDB
                                                    ↓
                                                 Bedrock (AI)
```

## Key Implementation Details

### Monorepo (npm workspaces)

**Install order (CRITICAL):**
```bash
npm ci                    # 1. Root first
cd frontend && npm ci     # 2. Frontend
cd ../backend && npm ci   # 3. Backend
```

### Timezone: JST (Asia/Tokyo, UTC+9)

All dates use JST for consistency:
```typescript
const nowJST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
```

### Backend Architecture

**Layers:**
```
Routes (Hono) → Services → Repositories → DynamoDB
```

**Local Development:**
```bash
cd backend
npm run dev  # Starts on http://localhost:3001
```

### AI Feed Suggestions

**Performance:**
- Request 20 feeds from Bedrock
- Parallel URL validation (2s timeout each)
- Select top 14 valid + 1 random default
- Target: ~20-25 seconds total
- No retry (API Gateway 29s timeout limit)

**Fallback:**
- If Bedrock fails: Return 1 random default feed
- Default feeds: 4 per locale (EN: BBC, NYT, Reuters, Guardian / JP: NHK, Asahi, Yahoo, ITmedia)

### Error Handling

- **Error messages**: Always in English
- **UI translation**: Frontend can translate for display
- **Logging**: Structured JSON format to CloudWatch

### Security

- **Secrets**: AWS Secrets Manager (for production secrets)
- **GitHub Authentication**: Uses `gh` CLI (no token in environment variables)
- **Gitleaks**: Pre-commit/pre-push checks
- **Environment variables**: `.env.local` (gitignored, for local development only)

### Deployment

**Frontend (Amplify):**
- Auto-deploy on push to `main`
- Build: `amplify.yml`

**Backend (GitHub Actions):**
- Build Docker image → Push to ECR → Update Lambda
- Trigger: Push to `main` with `backend/**` changes

**Infrastructure (Terraform):**
- Manual execution from local
- State: S3 + DynamoDB lock

### MCP (Model Context Protocol) Configuration

**GitHub MCP Setup:**
```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login

# Verify
gh auth status
```

**Configuration:** `.kiro/settings/mcp.json`
- GitHub MCP uses `gh` CLI authentication (no environment variables needed)
- Other MCP servers configured as needed

### CLI Pager Configuration

**IMPORTANT**: Disable pagers to prevent command interruption:

```bash
# Add to ~/.zshrc
echo 'export AWS_PAGER=""' >> ~/.zshrc
echo 'export GIT_PAGER=""' >> ~/.zshrc
source ~/.zshrc

# Verify
echo $AWS_PAGER  # Should be empty
echo $GIT_PAGER  # Should be empty
```

## Prohibited Practices

### Infrastructure
- ❌ Managing Terraform state locally
- ❌ Manual resource creation in AWS Console
- ❌ Storing Access Keys in GitHub Secrets (use OIDC)

### Deployment
- ❌ Direct deployment to production (except Terraform)
- ❌ Deployment skipping tests
- ❌ Chaining `git push` with `&&`

### Code
- ❌ Hardcoding sensitive information
- ❌ Disabling security checks

---

**For detailed implementation guidelines, refer to:**
- Phase 1 specs: `.kiro/specs/phase-1/`
- Phase 2 specs: `.kiro/specs/phase-2/`
- Phase 3 specs: `.kiro/specs/phase-3/`
