# Project Structure & Organization

## Current Directory Structure

```
fitness-app-website/
├── .kiro/                          # Kiro framework configuration
│   ├── specs/                      # Feature specifications
│   │   └── fitness-app/            # Main app specification
│   │       └── requirements.md     # Requirements document
│   └── steering/                   # Project guidance documents
│       ├── product.md              # Product overview
│       ├── tech.md                 # Technology stack info
│       └── structure.md            # This file
└── .vscode/                        # VS Code configuration
    └── settings.json               # IDE settings (Kiro MCP enabled)
```

## Kiro Framework Organization

### Specifications (`.kiro/specs/`)
- Each feature gets its own subdirectory
- Standard files per feature:
  - `requirements.md` - User stories and acceptance criteria
  - `design.md` - Technical design and architecture
  - `tasks.md` - Implementation task breakdown

### Steering Documents (`.kiro/steering/`)
- `product.md` - Product overview and philosophy
- `tech.md` - Technology stack and build information
- `structure.md` - Project organization guidelines

## Future Source Code Structure
*To be defined during design phase based on chosen technology stack*

Typical structure will include:
- `src/` - Source code
- `tests/` - Test files
- `docs/` - Additional documentation
- `public/` - Static assets
- Configuration files (package.json, etc.)

## File Naming Conventions
- Use kebab-case for directories and files
- Markdown files for documentation
- Follow framework-specific conventions for source code

## Development Guidelines
- All features start with specification in `.kiro/specs/`
- Update steering documents as project evolves
- Maintain clear separation between specifications and implementation
- Use descriptive names for directories and files