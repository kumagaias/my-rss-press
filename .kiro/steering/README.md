# Steering Documentation

This directory contains development guidelines for MyRSSPress.

---

## Structure

```
.kiro/steering/
├── common/                      # Reusable guidelines (any project)
│   ├── project.md              # Project standards
│   ├── structure.md            # Structure patterns
│   ├── tech.md                 # Technical practices
│   └── languages/              # Language-specific best practices
│       ├── typescript.md       # TypeScript conventions
│       ├── react.md            # React/Next.js patterns
│       ├── nodejs.md           # Node.js/Lambda patterns
│       └── terraform.md        # Terraform/IaC patterns
├── myrsspress/                  # MyRSSPress-specific
│   ├── project.md              # Project standards
│   ├── structure.md            # Project structure
│   ├── tech.md                 # Technical details
│   └── product.md              # Product specifications
└── README.md                    # This file
```

## Quick Start

### For New Team Members

1. **Start here**: Read `myrsspress/product.md` for product overview
2. **Project setup**: Read `myrsspress/project.md` for development workflow
3. **Architecture**: Read `myrsspress/tech.md` for technical details
4. **Code structure**: Read `myrsspress/structure.md` for file organization

### For Development

**Common Guidelines** (applicable to any project):
- `common/project.md` - General project standards
- `common/structure.md` - General structure patterns
- `common/tech.md` - General technical practices
- `common/languages/typescript.md` - TypeScript conventions
- `common/languages/react.md` - React/Next.js patterns
- `common/languages/nodejs.md` - Node.js/Lambda patterns
- `common/languages/terraform.md` - Terraform/IaC patterns

**MyRSSPress Specific**:
- `myrsspress/project.md` - MyRSSPress project standards
- `myrsspress/structure.md` - MyRSSPress structure
- `myrsspress/tech.md` - MyRSSPress technical details
- `myrsspress/product.md` - Product specifications

## Documentation Philosophy

### Common vs Project-Specific

**Common** (`common/`):
- Reusable across multiple projects
- Language/framework best practices
- General patterns and conventions
- Can be copied to other projects

**Project-Specific** (`myrsspress/`):
- MyRSSPress implementation details
- Project-specific architecture
- Product specifications
- Deployment procedures

### When to Update

**Common files**: When you discover a general best practice
**Project files**: When project requirements or implementation changes

## File Size Guidelines

- Keep files under 500 lines
- Split large files by topic
- Use cross-references between files

## Related Documentation

- **Specifications**: `.kiro/specs/` - Feature specifications (Phase 1, 2, 3)
- **Hooks**: `.kiro/hooks/` - Agent automation hooks
- **Bug Reports**: `../../docs/bugfix/` - Detailed bug reports and investigations
- **Root README**: `../../README.md` - Project overview

---

**Questions?** Check the relevant file above or ask the team.
