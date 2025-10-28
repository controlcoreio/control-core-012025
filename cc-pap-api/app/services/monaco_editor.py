"""
Monaco Editor Service for Rego Code Editing with IntelliSense and Regal Linting
"""

import json
from typing import Dict, List, Any, Optional
from fastapi import HTTPException

class MonacoEditorService:
    """Service for Monaco Editor configuration and Rego language support."""
    
    def __init__(self):
        self.rego_keywords = [
            "package", "import", "default", "true", "false", "null",
            "with", "as", "if", "else", "contains", "startswith", "endswith",
            "count", "sum", "max", "min", "sort", "reverse", "union", "intersection",
            "set_diff", "walk", "object", "json", "yaml", "base64", "base64url",
            "hex", "urlquery", "json", "json", "json", "json", "json", "json"
        ]
        
        self.rego_functions = [
            "all", "any", "concat", "format", "indexof", "lower", "upper",
            "replace", "split", "substring", "trim", "trim_left", "trim_right",
            "trim_prefix", "trim_suffix", "regex", "regex", "regex", "regex"
        ]
        
        self.rego_operators = [
            "=", "!=", "<", "<=", ">", ">=", "==", "!=", "in", "not", "and", "or"
        ]

    def get_rego_language_config(self) -> Dict[str, Any]:
        """Get Monaco Editor configuration for Rego language."""
        return {
            "id": "rego",
            "extensions": [".rego"],
            "aliases": ["rego", "openpolicyagent"],
            "mimetypes": ["text/x-rego", "application/x-rego"],
            "configuration": {
                "comments": {
                    "lineComment": "#",
                    "blockComment": ["/*", "*/"]
                },
                "brackets": [
                    ["{", "}"],
                    ["[", "]"],
                    ["(", ")"]
                ],
                "autoClosingPairs": [
                    ["{", "}"],
                    ["[", "]"],
                    ["(", ")"],
                    ['"', '"'],
                    ["'", "'"]
                ],
                "surroundingPairs": [
                    ["{", "}"],
                    ["[", "]"],
                    ["(", ")"],
                    ['"', '"'],
                    ["'", "'"]
                ],
                "folding": {
                    "markers": {
                        "start": "^\\s*#region\\b",
                        "end": "^\\s*#endregion\\b"
                    }
                }
            },
            "monarch": {
                "tokenizer": {
                    "root": [
                        [r'#.*$', 'comment'],
                        [r'package\b', 'keyword'],
                        [r'import\b', 'keyword'],
                        [r'default\b', 'keyword'],
                        [r'with\b', 'keyword'],
                        [r'as\b', 'keyword'],
                        [r'if\b', 'keyword'],
                        [r'else\b', 'keyword'],
                        [r'contains\b', 'keyword'],
                        [r'startswith\b', 'keyword'],
                        [r'endswith\b', 'keyword'],
                        [r'count\b', 'keyword'],
                        [r'sum\b', 'keyword'],
                        [r'max\b', 'keyword'],
                        [r'min\b', 'keyword'],
                        [r'sort\b', 'keyword'],
                        [r'reverse\b', 'keyword'],
                        [r'union\b', 'keyword'],
                        [r'intersection\b', 'keyword'],
                        [r'set_diff\b', 'keyword'],
                        [r'walk\b', 'keyword'],
                        [r'object\b', 'keyword'],
                        [r'json\b', 'keyword'],
                        [r'yaml\b', 'keyword'],
                        [r'base64\b', 'keyword'],
                        [r'base64url\b', 'keyword'],
                        [r'hex\b', 'keyword'],
                        [r'urlquery\b', 'keyword'],
                        [r'true\b', 'keyword'],
                        [r'false\b', 'keyword'],
                        [r'null\b', 'keyword'],
                        [r'allow\b', 'keyword'],
                        [r'deny\b', 'keyword'],
                        [r'[a-zA-Z_][a-zA-Z0-9_]*', 'identifier'],
                        [r'"[^"]*"', 'string'],
                        [r"'[^']*'", 'string'],
                        [r'\d+', 'number'],
                        [r'[{}()\[\]]', 'delimiter.bracket'],
                        [r'[=!<>]=?', 'operator'],
                        [r'[+\-*/%]', 'operator'],
                        [r'[;,.]', 'delimiter']
                    ]
                }
            }
        }

    def get_rego_completions(self, context: str) -> List[Dict[str, Any]]:
        """Get Rego code completions based on context."""
        completions = []
        
        # Add keywords
        for keyword in self.rego_keywords:
            completions.append({
                "label": keyword,
                "kind": "keyword",
                "insertText": keyword,
                "detail": "Rego keyword",
                "documentation": f"Rego keyword: {keyword}"
            })
        
        # Add functions
        for func in self.rego_functions:
            completions.append({
                "label": func,
                "kind": "function",
                "insertText": func + "()",
                "detail": "Rego function",
                "documentation": f"Rego function: {func}"
            })
        
        # Add common patterns
        patterns = [
            {
                "label": "package",
                "kind": "snippet",
                "insertText": "package ${1:package_name}\n\n${2:rules}",
                "detail": "Package declaration",
                "documentation": "Create a new Rego package"
            },
            {
                "label": "default allow",
                "kind": "snippet",
                "insertText": "default allow = ${1:false}\n\nallow {\n\t${2:condition}\n}",
                "detail": "Default allow rule",
                "documentation": "Create a default allow rule"
            },
            {
                "label": "default deny",
                "kind": "snippet",
                "insertText": "default deny = ${1:false}\n\ndeny {\n\t${2:condition}\n}",
                "detail": "Default deny rule",
                "documentation": "Create a default deny rule"
            },
            {
                "label": "import",
                "kind": "snippet",
                "insertText": "import data.${1:module}\n\n${2:rules}",
                "detail": "Import statement",
                "documentation": "Import data from another module"
            }
        ]
        
        completions.extend(patterns)
        return completions

    def validate_rego_syntax(self, code: str) -> List[Dict[str, Any]]:
        """Validate Rego syntax and return errors/warnings."""
        errors = []
        warnings = []
        
        lines = code.split('\n')
        
        for i, line in enumerate(lines, 1):
            line = line.strip()
            
            # Check for common syntax errors
            if line.startswith('package') and not line.endswith(';') and not line.endswith(' '):
                if not line.replace('package', '').strip():
                    errors.append({
                        "line": i,
                        "column": 1,
                        "message": "Package name is required",
                        "severity": "error"
                    })
            
            # Check for unclosed strings
            if line.count('"') % 2 != 0:
                errors.append({
                    "line": i,
                    "column": line.find('"') + 1,
                    "message": "Unclosed string literal",
                    "severity": "error"
                })
            
            # Check for common patterns
            if 'allow' in line and '=' not in line and '{' not in line:
                warnings.append({
                    "line": i,
                    "column": 1,
                    "message": "Consider using 'allow = true' or 'allow = false' for boolean rules",
                    "severity": "warning"
                })
        
        return errors + warnings

    def format_rego_code(self, code: str) -> str:
        """Format Rego code for better readability."""
        lines = code.split('\n')
        formatted_lines = []
        indent_level = 0
        
        for line in lines:
            stripped = line.strip()
            if not stripped:
                formatted_lines.append('')
                continue
            
            # Decrease indent for closing braces
            if stripped.startswith('}') or stripped.startswith(']'):
                indent_level = max(0, indent_level - 1)
            
            # Add indentation
            formatted_line = '  ' * indent_level + stripped
            formatted_lines.append(formatted_line)
            
            # Increase indent for opening braces
            if stripped.endswith('{') or stripped.endswith('['):
                indent_level += 1
        
        return '\n'.join(formatted_lines)

    def get_rego_snippets(self) -> List[Dict[str, Any]]:
        """Get Rego code snippets for common patterns."""
        return [
            {
                "label": "Policy Package",
                "kind": "snippet",
                "insertText": "package ${1:policy_name}\n\n# Default deny\ndefault allow = false\n\n# Allow rule\nallow {\n\t${2:condition}\n}\n\n# Deny rule\ndeny {\n\t${3:condition}\n}",
                "detail": "Complete policy package",
                "documentation": "Create a complete Rego policy package with allow/deny rules"
            },
            {
                "label": "Role-based Access",
                "kind": "snippet",
                "insertText": "package rbac\n\n# Check if user has required role\nhas_role(user, role) {\n\tuser.roles[_] == role\n}\n\n# Allow access if user has required role\nallow {\n\tinput.user == user\n\thas_role(user, \"${1:admin}\")\n}",
                "detail": "Role-based access control",
                "documentation": "Create role-based access control rules"
            },
            {
                "label": "Time-based Access",
                "kind": "snippet",
                "insertText": "package time_based\n\n# Check if current time is within allowed hours\nwithin_business_hours {\n\ttime.clock(input.time)[0] >= 9\n\ttime.clock(input.time)[0] <= 17\n}\n\n# Allow access during business hours\nallow {\n\twithin_business_hours\n}",
                "detail": "Time-based access control",
                "documentation": "Create time-based access control rules"
            },
            {
                "label": "Resource-based Access",
                "kind": "snippet",
                "insertText": "package resource_based\n\n# Check if user owns the resource\nowns_resource(user, resource) {\n\tresource.owner == user\n}\n\n# Allow access if user owns the resource\nallow {\n\tinput.user == user\n\tinput.resource == resource\n\towns_resource(user, resource)\n}",
                "detail": "Resource-based access control",
                "documentation": "Create resource-based access control rules"
            }
        ]

# Global instance
monaco_service = MonacoEditorService()
