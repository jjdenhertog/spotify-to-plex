import { Pill } from './expressionToPills';
import type { OperationText } from '../types/MatchFilterTypes';

export function pillsToExpression(pills: Pill[]) {
    if (!pills.length) {
        return '';
    }

    return pills
        .map(pill => {
            if (pill.type === 'combinator') {
                return pill.combinator;
            }
            
            // For conditions, reconstruct the expression text
            if (pill.field && pill.operation) {
                let operationText: OperationText = pill.operation;
                
                if (pill.operation === 'similarity' && pill.threshold !== undefined) {
                    operationText = `similarity>=${pill.threshold}`;
                }

                return `${pill.field}:${operationText}`;
            }
            
            if (pill.field) {
                // Incomplete pill - just show the field name
                return pill.field;
            }
            
            // Skip pills without a field (shouldn't happen, but safety check)
            return '';
        })
        .filter(text => text && text.trim() !== '')
        .join(' ');
}