"""
Regal Linter Service for Rego Code Validation

This service integrates with the Regal linter to validate Rego policy code.
Regal: https://github.com/StyraInc/regal
"""

import subprocess
import json
import tempfile
import os
from typing import Dict, List, Optional
from pathlib import Path


class RegalLinter:
    """Wrapper for Regal Rego linter"""
    
    def __init__(self, regal_path: str = "regal"):
        """
        Initialize Regal linter
        
        Args:
            regal_path: Path to regal binary (default: "regal" assumes it's in PATH)
        """
        self.regal_path = regal_path
        self._check_regal_available()
    
    def _check_regal_available(self) -> bool:
        """Check if Regal is installed and available"""
        try:
            result = subprocess.run(
                [self.regal_path, "version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode != 0:
                raise RuntimeError(f"Regal not available: {result.stderr}")
            return True
        except FileNotFoundError:
            raise RuntimeError(
                f"Regal binary not found at '{self.regal_path}'. "
                "Please install Regal: https://github.com/StyraInc/regal"
            )
        except Exception as e:
            raise RuntimeError(f"Error checking Regal availability: {str(e)}")
    
    def lint_rego(self, code: str, filename: str = "policy.rego") -> Dict:
        """
        Lint Rego code using Regal
        
        Args:
            code: Rego policy code to lint
            filename: Optional filename for better error messages
        
        Returns:
            Dictionary with validation results:
            {
                "valid": bool,
                "violations": List[Dict],
                "summary": Dict
            }
        """
        # Create temporary file for the Rego code
        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix='.rego',
            delete=False,
            encoding='utf-8'
        ) as temp_file:
            temp_file.write(code)
            temp_path = temp_file.name
        
        try:
            # Run Regal lint with JSON output
            result = subprocess.run(
                [self.regal_path, "lint", "--format", "json", temp_path],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            # Parse JSON output
            if result.stdout:
                try:
                    lint_results = json.loads(result.stdout)
                except json.JSONDecodeError:
                    # If JSON parsing fails, return error
                    return {
                        "valid": False,
                        "violations": [{
                            "severity": "error",
                            "message": "Failed to parse Regal output",
                            "line": 1,
                            "column": 1
                        }],
                        "summary": {"errors": 1, "warnings": 0}
                    }
                
                # Transform Regal output to our format
                violations = self._transform_violations(lint_results)
                
                # Check if code is valid (no errors)
                has_errors = any(v.get("severity") == "error" for v in violations)
                
                return {
                    "valid": not has_errors,
                    "violations": violations,
                    "summary": self._get_summary(violations)
                }
            else:
                # No violations found
                return {
                    "valid": True,
                    "violations": [],
                    "summary": {"errors": 0, "warnings": 0}
                }
        
        except subprocess.TimeoutExpired:
            return {
                "valid": False,
                "violations": [{
                    "severity": "error",
                    "message": "Regal linting timed out",
                    "line": 1,
                    "column": 1
                }],
                "summary": {"errors": 1, "warnings": 0}
            }
        except Exception as e:
            return {
                "valid": False,
                "violations": [{
                    "severity": "error",
                    "message": f"Linting error: {str(e)}",
                    "line": 1,
                    "column": 1
                }],
                "summary": {"errors": 1, "warnings": 0}
            }
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_path)
            except Exception:
                pass
    
    def _transform_violations(self, regal_output: Dict) -> List[Dict]:
        """Transform Regal output format to our standard format"""
        violations = []
        
        # Regal output structure: {"violations": [...]}
        if isinstance(regal_output, dict) and "violations" in regal_output:
            for violation in regal_output.get("violations", []):
                violations.append({
                    "severity": violation.get("level", "warning"),
                    "message": violation.get("description", "Unknown violation"),
                    "line": violation.get("location", {}).get("row", 1),
                    "column": violation.get("location", {}).get("col", 1),
                    "rule": violation.get("title", ""),
                    "category": violation.get("category", "")
                })
        
        return violations
    
    def _get_summary(self, violations: List[Dict]) -> Dict:
        """Get summary of violations"""
        errors = sum(1 for v in violations if v.get("severity") == "error")
        warnings = sum(1 for v in violations if v.get("severity") == "warning")
        
        return {
            "errors": errors,
            "warnings": warnings,
            "total": len(violations)
        }
    
    def format_rego(self, code: str) -> str:
        """
        Format Rego code using Regal
        
        Args:
            code: Rego policy code to format
        
        Returns:
            Formatted Rego code
        """
        # Create temporary file for the Rego code
        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix='.rego',
            delete=False,
            encoding='utf-8'
        ) as temp_file:
            temp_file.write(code)
            temp_path = temp_file.name
        
        try:
            # Run Regal format
            result = subprocess.run(
                [self.regal_path, "format", temp_path],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0 and result.stdout:
                return result.stdout
            else:
                # If formatting fails, return original code
                return code
        
        except Exception:
            # If formatting fails, return original code
            return code
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_path)
            except Exception:
                pass


# Singleton instance
_linter_instance: Optional[RegalLinter] = None


def get_regal_linter() -> RegalLinter:
    """Get or create Regal linter singleton instance"""
    global _linter_instance
    
    if _linter_instance is None:
        _linter_instance = RegalLinter()
    
    return _linter_instance

