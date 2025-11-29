# Tool Management Guide

## Overview

This project uses `.tool-versions` to manage required tool versions. This ensures all developers use consistent versions of tools.

## Required Tools

The following tools are required for development:

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 24.11.0 | Runtime for frontend and backend |
| Terraform | 1.10.3 | Infrastructure as Code |
| AWS CLI | >= 2.0 | AWS resource management |
| Docker | >= 20.0 | Container runtime for backend |
| Gitleaks | Latest | Security scanning for secrets |

## Installation Methods

### Method 1: Using asdf (Recommended)

[asdf](https://asdf-vm.com/) is a version manager that can manage multiple runtime versions.

**Install asdf:**
```bash
# macOS
brew install asdf

# Linux
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.13.1
echo '. "$HOME/.asdf/asdf.sh"' >> ~/.bashrc
```

**Install tools:**
```bash
# From project root
make install-tools
```

This will:
1. Add required asdf plugins (nodejs, terraform)
2. Install versions specified in `.tool-versions`

### Method 2: Manual Installation

**Check current status:**
```bash
make check-tools
```

**Install missing tools:**

1. **Node.js 24.x**
   ```bash
   # macOS
   brew install node@24
   
   # Or download from https://nodejs.org/
   ```

2. **Terraform 1.10.x**
   ```bash
   # macOS
   brew install terraform
   
   # Or download from https://www.terraform.io/downloads.html
   ```

3. **AWS CLI**
   ```bash
   # macOS
   brew install awscli
   
   # Or follow: https://aws.amazon.com/cli/
   ```

4. **Docker**
   ```bash
   # macOS
   brew install --cask docker
   
   # Or download Docker Desktop: https://www.docker.com/get-started
   ```

5. **Gitleaks**
   ```bash
   # macOS
   brew install gitleaks
   
   # Or follow: https://github.com/gitleaks/gitleaks#installing
   ```

## Makefile Commands

### Tool Management

```bash
# Check if required tools are installed
make check-tools

# Install tools via asdf (if available)
make install-tools
```

### Development

```bash
# Install project dependencies (checks tools first)
make install

# Clean build artifacts
make clean
```

### Testing

```bash
# Run all tests
make test

# Run unit tests only
make test-unit

# Run security checks
make security-check
```

## Updating Tool Versions

To update tool versions:

1. Edit `.tool-versions`:
   ```
   nodejs 24.12.0
   terraform 1.11.0
   ```

2. Install new versions:
   ```bash
   # With asdf
   asdf install
   
   # Or manually install new versions
   ```

3. Test with new versions:
   ```bash
   make check-tools
   make test
   ```

4. Commit changes:
   ```bash
   git add .tool-versions
   git commit -m "chore: Update tool versions"
   ```

## Troubleshooting

### asdf: command not found

**Solution:** Install asdf or use manual installation method.

### Node.js version mismatch

**Solution:**
```bash
# With asdf
asdf install nodejs 24.11.0
asdf global nodejs 24.11.0

# Or use nvm
nvm install 24.11.0
nvm use 24.11.0
```

### Terraform version mismatch

**Solution:**
```bash
# With asdf
asdf install terraform 1.10.3
asdf global terraform 1.10.3

# Or use tfenv
tfenv install 1.10.3
tfenv use 1.10.3
```

### Docker not running

**Solution:**
```bash
# Start Docker Desktop (macOS)
open -a Docker

# Or start Docker daemon (Linux)
sudo systemctl start docker
```

## CI/CD Integration

GitHub Actions automatically uses versions from `.tool-versions`:

```yaml
# .github/workflows/test.yml
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version-file: '.tool-versions'

- name: Setup Terraform
  uses: hashicorp/setup-terraform@v2
  with:
    terraform_version: '1.10.3'
```

## Best Practices

1. **Always check tools before starting work:**
   ```bash
   make check-tools
   ```

2. **Keep `.tool-versions` in version control:**
   - This file should be committed to Git
   - It ensures team consistency

3. **Update tools regularly:**
   - Check for security updates
   - Test thoroughly before updating

4. **Document version requirements:**
   - Update this guide when adding new tools
   - Explain why specific versions are required

## Support

For issues with tool installation:
1. Check this guide's troubleshooting section
2. Refer to official tool documentation
3. Ask in team chat or create an issue

## References

- [asdf Documentation](https://asdf-vm.com/)
- [Node.js Downloads](https://nodejs.org/)
- [Terraform Downloads](https://www.terraform.io/downloads.html)
- [AWS CLI Installation](https://aws.amazon.com/cli/)
- [Docker Installation](https://docs.docker.com/get-docker/)
- [Gitleaks Installation](https://github.com/gitleaks/gitleaks#installing)
