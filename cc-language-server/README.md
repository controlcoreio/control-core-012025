# Control Core Rego Language Server

A comprehensive Language Server Protocol (LSP) implementation for Rego policy language, designed specifically for the Control Core Policy Administration Platform.

## Features

- **Syntax Highlighting**: Full Rego syntax support with Monaco editor integration
- **IntelliSense**: Auto-completion for Rego keywords, functions, and built-ins
- **Error Detection**: Real-time policy validation and error reporting
- **Symbol Navigation**: Document symbols, go-to-definition, and hover information
- **Policy Templates**: Common policy patterns and snippets
- **OPA Integration**: Direct validation with Open Policy Agent

## Installation

```bash
npm install
npm run build
```

## Usage

The language server can be integrated with any LSP-compatible editor:

- **VS Code**: Install the Control Core extension
- **Monaco Editor**: Direct integration in web applications
- **Other Editors**: Via LSP protocol

## Development

```bash
npm run dev    # Watch mode
npm run build  # Build for production
npm test       # Run tests
```

## Architecture

- **Parser**: AST generation for Rego policies
- **Validator**: Real-time policy validation
- **Completer**: IntelliSense and auto-completion
- **Symbol Provider**: Navigation and symbol resolution
- **Hover Provider**: Contextual help and documentation
- **Definition Provider**: Go-to-definition functionality

## Integration with Control Core

This language server is designed to enhance the developer experience in the Control Core PAP (Policy Administration Platform) by providing:

- Enhanced policy editing capabilities
- Real-time validation feedback
- Template and snippet support
- Integration with the existing Monaco editor setup
