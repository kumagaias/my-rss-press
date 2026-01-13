# Kiro Configuration

This directory contains Kiro AI assistant configuration for the MyRSSPress project.

## Directory Structure

```
.kiro/
├── README.md        # This file
├── steering/        # Project-specific steering rules
│   ├── product.md   # Product specifications
│   ├── structure.md # Project structure
│   └── tech.md      # Technical architecture
└── specs/           # Feature specifications
    └── features/    # Feature-specific specs
```

## Steering Rules

- **product.md**: Product specifications, features, and requirements
- **structure.md**: Project structure and file organization
- **tech.md**: Technical architecture and implementation details

## Global Configuration

This project uses global Kiro best practices from:

**[kumagaias/kiro-best-practices](https://github.com/kumagaias/kiro-best-practices)**

Global steering rules provide general development best practices that apply across all projects.

## Precedence

Project-specific rules (`.kiro/steering/`) take precedence over global rules (`~/.kiro/steering/`).

## Usage

Kiro automatically loads steering rules from both locations. No manual configuration is required.

## Specifications

Feature specifications are in `.kiro/specs/features/` with requirements, design, and task documents for structured development.

## More Information

[Kiro Best Practices Repository](https://github.com/kumagaias/kiro-best-practices)
