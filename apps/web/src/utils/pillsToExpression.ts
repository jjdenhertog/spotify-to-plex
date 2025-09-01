import { Pill } from './expressionToPills';
import type { OperationText } from '../types/MatchFilterTypes';

export function pillsToExpression(pills: Pill[]): string {
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
            
            // Return the raw text if we can't parse it properly
            return pill.text;
        })
        .join(' ');
}