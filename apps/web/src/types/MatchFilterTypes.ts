// Types for the new expression-based match filter system

export type ViewMode = 'ui' | 'json';

// New expression-based filter configuration
export type MatchFilterRule = {
  reason: string;
  expression: string; // e.g., "artist:match AND title:match"
  enabled?: boolean;
};

// Legacy filter configuration for backward compatibility
export type LegacyMatchFilterConfig = {
  reason: string;
  filter: string; // Legacy function string
};

// Union type to support both formats during transition
export type MatchFilterConfig = MatchFilterRule | LegacyMatchFilterConfig;

// Expression parsing types
export type FieldType = 'artist' | 'title' | 'album' | 'artistWithTitle' | 'artistInTitle';
export type OperationType = 'match' | 'contains' | 'similarity';
export type CombinatorType = 'AND' | 'OR';

export type ParsedCondition = {
  field: FieldType;
  operation: OperationType;
  threshold?: number; // For similarity operations
};

export type ExpressionToken = ParsedCondition | CombinatorType;

// Autocomplete suggestions
export type AutocompleteSuggestion = {
  label: string;
  value: string;
  description?: string;
  category: 'field' | 'operation' | 'combinator';
};

// Validation result
export type ValidationResult = {
  isValid: boolean;
  error?: string;
  suggestions?: string[];
};
