/**
 * Policy Complexity Analyzer
 * 
 * Analyzes policy data to detect advanced Rego features that may not be
 * fully supported in the visual no-code builder.
 */

export interface PolicyCondition {
  id: string;
  attribute: string;
  operator: string;
  value: string;
  enabled: boolean;
}

export interface PolicyData {
  name: string;
  description: string;
  resourceId: string;
  bouncerId: string;
  effect: 'allow' | 'deny' | 'mask' | 'log';
  conditions: PolicyCondition[];
  regoCode: string;
  status: 'draft' | 'active';
}

export type ComplexityLevel = 'basic' | 'medium' | 'advanced';

export interface ComplexityAnalysis {
  level: ComplexityLevel;
  requiresCodeEditor: boolean;
  reasons: string[];
  suggestions: string[];
  detectedFeatures: {
    nestedConditions: boolean;
    complexOperators: boolean;
    comprehensions: boolean;
    customFunctions: boolean;
    dataLookups: boolean;
    advancedQueries: boolean;
  };
}

/**
 * Analyze policy complexity to determine if visual builder is sufficient
 */
export function analyzePolicyComplexity(policyData: PolicyData): ComplexityAnalysis {
  const reasons: string[] = [];
  const suggestions: string[] = [];
  const detectedFeatures = {
    nestedConditions: false,
    complexOperators: false,
    comprehensions: false,
    customFunctions: false,
    dataLookups: false,
    advancedQueries: false,
  };

  // Check condition complexity
  if (policyData.conditions.length > 5) {
    reasons.push('More than 5 conditions - may benefit from helper functions');
    detectedFeatures.nestedConditions = true;
  }

  // Check for complex operators
  const complexOperatorCount = policyData.conditions.filter(c => 
    ['regex', 'in', 'not_in', 'starts_with', 'ends_with'].includes(c.operator)
  ).length;

  if (complexOperatorCount > 2) {
    reasons.push('Multiple complex operators detected');
    detectedFeatures.complexOperators = true;
  }

  // Analyze Rego code if present
  if (policyData.regoCode) {
    const code = policyData.regoCode;

    // Check for comprehensions
    if (/\[.*\|.*\]|\{.*\|.*\}/.test(code)) {
      reasons.push('Array or object comprehensions detected');
      detectedFeatures.comprehensions = true;
      suggestions.push('Use comprehensions in code editor for filtering and transformations');
    }

    // Check for custom functions/helper rules
    if (/^[a-z_][a-z0-9_]*\(.*\)\s*(=|:=|\{)/.test(code)) {
      reasons.push('Custom functions or helper rules detected');
      detectedFeatures.customFunctions = true;
      suggestions.push('Define reusable functions in code editor');
    }

    // Check for data lookups
    if (/data\.[a-z_]/.test(code)) {
      reasons.push('External data lookups detected');
      detectedFeatures.dataLookups = true;
      suggestions.push('Use Policy Information Points (PIPs) for dynamic data');
    }

    // Check for advanced query patterns
    if (/\bsome\b|\bevery\b/.test(code)) {
      reasons.push('Advanced query patterns (some/every) detected');
      detectedFeatures.advancedQueries = true;
      suggestions.push('Use some/every keywords for complex iterations');
    }

    // Check for nested rules
    const braceCount = (code.match(/{/g) || []).length;
    if (braceCount > 3) {
      reasons.push('Multiple nested rule blocks detected');
      detectedFeatures.nestedConditions = true;
    }
  }

  // Determine complexity level
  let level: ComplexityLevel = 'basic';
  const featureCount = Object.values(detectedFeatures).filter(Boolean).length;

  if (featureCount >= 3 || detectedFeatures.comprehensions || detectedFeatures.advancedQueries) {
    level = 'advanced';
  } else if (featureCount >= 1) {
    level = 'medium';
  }

  const requiresCodeEditor = level === 'advanced' || 
    (level === 'medium' && (detectedFeatures.comprehensions || detectedFeatures.customFunctions));

  return {
    level,
    requiresCodeEditor,
    reasons,
    suggestions,
    detectedFeatures,
  };
}

/**
 * Get user-friendly message based on complexity analysis
 */
export function getComplexityMessage(analysis: ComplexityAnalysis): string {
  if (analysis.level === 'basic') {
    return 'This policy can be fully created using the visual builder.';
  }

  if (analysis.level === 'medium') {
    return 'This policy has some complexity. Consider using the Code Editor for more control.';
  }

  return 'This policy uses advanced Rego features not available in the visual builder. Switch to Code Editor for full OPA capabilities.';
}

/**
 * Check if specific advanced features would be beneficial
 */
export function suggestAdvancedFeatures(policyData: PolicyData): string[] {
  const suggestions: string[] = [];

  // Suggest comprehensions for multiple similar conditions
  const attributeGroups = new Map<string, number>();
  policyData.conditions.forEach(c => {
    attributeGroups.set(c.attribute, (attributeGroups.get(c.attribute) || 0) + 1);
  });

  const duplicateAttributes = Array.from(attributeGroups.entries()).filter(([_, count]) => count > 1);
  if (duplicateAttributes.length > 0) {
    suggestions.push('Use array comprehensions to simplify multiple checks on the same attribute');
  }

  // Suggest functions for repeated logic patterns
  if (policyData.conditions.length > 4) {
    suggestions.push('Consider creating helper functions to organize complex logic');
  }

  // Suggest data lookups for dynamic behavior
  if (policyData.effect === 'allow' && policyData.conditions.length > 2) {
    suggestions.push('Use data lookups to dynamically fetch permissions based on roles');
  }

  return suggestions;
}

