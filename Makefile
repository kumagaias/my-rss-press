.PHONY: help install install-tools check-tools clean test test-unit test-lint test-security security-check

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "MyRSSPress - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

check-tools: ## Check if required tools are installed
	@echo "Checking required tools..."
	@echo ""
	@command -v node >/dev/null 2>&1 && echo "✓ Node.js: $$(node --version)" || echo "✗ Node.js not found (required: 24.x or 22.x)"
	@command -v npm >/dev/null 2>&1 && echo "✓ npm: $$(npm --version)" || echo "✗ npm not found"
	@command -v terraform >/dev/null 2>&1 && echo "✓ Terraform: $$(terraform version -json | grep -o '\"terraform_version\":\"[^\"]*' | cut -d'\"' -f4)" || echo "✗ Terraform not found (required: >= 1.10.0)"
	@command -v aws >/dev/null 2>&1 && echo "✓ AWS CLI: $$(aws --version 2>&1 | cut -d' ' -f1 | cut -d'/' -f2)" || echo "✗ AWS CLI not found"
	@command -v docker >/dev/null 2>&1 && echo "✓ Docker: $$(docker --version | cut -d' ' -f3 | tr -d ',')" || echo "✗ Docker not found"
	@command -v gitleaks >/dev/null 2>&1 && echo "✓ Gitleaks: $$(gitleaks version)" || echo "✗ Gitleaks not found (required for security checks)"
	@echo ""
	@echo "See .tool-versions for required versions"
	@echo ""

install-tools: ## Install tools using asdf (if available)
	@if command -v asdf >/dev/null 2>&1; then \
		echo "Installing tools via asdf..."; \
		asdf plugin add nodejs || true; \
		asdf plugin add terraform || true; \
		asdf install; \
		echo "✓ Tools installed via asdf"; \
	else \
		echo "asdf not found. Please install tools manually:"; \
		echo "  - Node.js 24.x or 22.x: https://nodejs.org/"; \
		echo "  - Terraform >= 1.10.0: https://www.terraform.io/downloads.html"; \
		echo "  - AWS CLI: https://aws.amazon.com/cli/"; \
		echo "  - Docker: https://www.docker.com/get-started"; \
		echo "  - Gitleaks: https://github.com/gitleaks/gitleaks"; \
		echo ""; \
		echo "Or install asdf: https://asdf-vm.com/"; \
	fi

install: check-tools ## Install dependencies for frontend and backend
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "✓ All dependencies installed"

clean: ## Clean build artifacts
	@echo "Cleaning frontend..."
	cd frontend && rm -rf .next out dist node_modules/.cache
	@echo "Cleaning backend..."
	cd backend && rm -rf dist
	@echo "✓ Clean complete"

test-unit: ## Run unit tests only
	@echo "Running frontend unit tests..."
	cd frontend && npm test
	@echo "Running backend unit tests..."
	cd backend && npm test
	@echo "✓ Unit tests complete"

test-lint: ## Run ESLint checks
	@echo "Running frontend ESLint..."
	cd frontend && npm run lint
	@echo "Running backend ESLint..."
	cd backend && npm run lint
	@echo "✓ ESLint checks complete"

test-security: ## Run security checks
	@echo "Running security checks..."
	./scripts/security-check.sh
	@echo "✓ Security checks complete"

security-check: test-security ## Alias for test-security

test-vulnerabilities: ## Check npm vulnerabilities (medium+ severity)
	@echo "Checking npm vulnerabilities..."
	./scripts/npm-audit-check.sh
	@echo "✓ Vulnerability checks complete"

audit: test-vulnerabilities ## Alias for test-vulnerabilities

test: test-unit test-lint test-security test-vulnerabilities ## Run all tests (unit + lint + security + vulnerabilities)
	@echo "✓ All tests complete"
