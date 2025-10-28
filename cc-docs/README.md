# Control Core Documentation

Comprehensive documentation for Control Core - the centralized authorization and compliance platform built for the AI-driven enterprise. It solves the core problem of securing the dynamic, real-time interactions between new AI initiatives and legacy technology. By enforcing business, security, and compliance rules with dynamic context management, Control Core eliminates the need for brittle, custom-coded access logic, turning a major security liability into a strategic advantage. It empowers organizations to innovate faster, reduce operational costs, and mitigate the risk of a breach.

## Documentation Structure

This documentation is built with Next.js and MDX, providing a modern, interactive documentation experience.

### Key Sections

- **Getting Started** - Quick start guides and installation
- **API Documentation** - Complete API reference and guides
- **User Guides** - End-user documentation and tutorials
- **Administrator Guides** - System administration and management
- **DevOps Guides** - Infrastructure and deployment guides
- **Architecture** - System architecture and design principles

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies

npm install
# Start development server

npm run dev
# Build for production

npm run build
```

### Content Management

The documentation is organized in the `app/` directory:

```text
app/
├── page.mdx                 # Homepage
├── api/                     # API documentation
├── guides/                  # User and admin guides
├── architecture/            # Architecture documentation
└── enterprise/             # Enterprise features
```

### Writing Documentation

- Use MDX for rich content with React components
- Follow the established structure and naming conventions
- Include code examples and interactive elements
- Keep content up-to-date with the latest features

## Features

### Interactive Documentation

- **Live Code Examples** - Executable code snippets
- **API Explorer** - Interactive API testing
- **Search** - Full-text search across all documentation
- **Navigation** - Hierarchical navigation with TOC

### Content Types

- **Guides** - Step-by-step tutorials
- **API Reference** - Complete API documentation
- **Architecture** - System design and principles
- **Troubleshooting** - Common issues and solutions

## Deployment

### Development Instance

```bash
npm run dev
```

### Production Instance

```bash
npm run build
npm run start
```

### Static Export

```bash
npm run export
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the documentation locally
5. Submit a pull request

## Support

- **Documentation**: [docs.controlcore.io](https://docs.controlcore.io)
- **Discussion Channel**: [discord.gg/nymdf2bn](https://discord.gg/NymDF2bN)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
