/* eslint-disable custom/no-export-only-files */
// Types for the expression-based match filter system

// Expression-based filter configuration (just a string)
export type MatchFilterRule = string; // e.g., "artist:match AND title:match"

// Expression parsing types
export type FieldType = 'artist' | 'title' | 'album' | 'artistWithTitle' | 'artistInTitle';
export type OperationType = 'match' | 'contains' | 'similarity' | 'is' | 'not';
export type OperationText = OperationType | `similarity>=${number}`;
export type CombinatorType = 'AND' | 'OR';

export type ParsedCondition = {
  field: FieldType;
  operation: OperationType;
  threshold?: number; // For similarity operations
  negated?: boolean; // For 'not' operator
};
