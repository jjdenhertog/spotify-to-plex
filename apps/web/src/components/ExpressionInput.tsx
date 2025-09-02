import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
    TextField,
    Autocomplete,
    Paper,
    Typography,
    Alert,
    Box
} from '@mui/material';
import {
    AutocompleteSuggestion,
    ValidationResult
} from '../types/MatchFilterTypes';
import CustomOption from './CustomOption';
import CustomPaper from './CustomPaper';

type ExpressionInputProps = {
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly error?: string;
    readonly placeholder?: string;
    readonly disabled?: boolean;
    readonly size?: 'small' | 'medium';
};

// Autocomplete suggestions
const FIELD_SUGGESTIONS: AutocompleteSuggestion[] = [
    { label: 'artist', value: 'artist', description: 'Artist name matching', category: 'field' },
    { label: 'title', value: 'title', description: 'Track title matching', category: 'field' },
    { label: 'album', value: 'album', description: 'Album name matching', category: 'field' },
    { label: 'artistWithTitle', value: 'artistWithTitle', description: 'Combined artist and title', category: 'field' },
    { label: 'artistInTitle', value: 'artistInTitle', description: 'Artist name found in title', category: 'field' }
];

const OPERATION_SUGGESTIONS: AutocompleteSuggestion[] = [
    { label: ':match', value: ':match', description: 'Exact match required', category: 'operation' },
    { label: ':contains', value: ':contains', description: 'Partial match (substring)', category: 'operation' },
    { label: ':similarity>=0.8', value: ':similarity>=0.8', description: 'Similarity threshold (0-1)', category: 'operation' },
    { label: ':similarity>=0.85', value: ':similarity>=0.85', description: 'High similarity threshold', category: 'operation' },
    { label: ':similarity>=0.9', value: ':similarity>=0.9', description: 'Very high similarity', category: 'operation' }
];

const COMBINATOR_SUGGESTIONS: AutocompleteSuggestion[] = [
    { label: 'AND', value: ' AND ', description: 'Both conditions must be true', category: 'combinator' },
    { label: 'OR', value: ' OR ', description: 'Either condition can be true', category: 'combinator' }
];

const ALL_SUGGESTIONS = [...FIELD_SUGGESTIONS, ...OPERATION_SUGGESTIONS, ...COMBINATOR_SUGGESTIONS];


const ExpressionInput: React.FC<ExpressionInputProps> = ({
    value,
    onChange,
    error,
    placeholder = 'e.g., artist:match AND title:contains',
    disabled = false,
    size = 'small'
}) => {
    const [inputValue, setInputValue] = useState(value);
    const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true });
    const inputRef = useRef<HTMLInputElement>(null);

    // Validate expression syntax
    const validateExpression = useCallback((expr: string): ValidationResult => {
        if (!expr.trim()) {
            return { isValid: true }; // Empty is valid
        }

        // Basic syntax validation
        const tokens = expr.split(/\s+(AND|OR)\s+/);
        const conditions = tokens.filter((_, index) => index % 2 === 0); // Every other token is a condition

        for (const condition of conditions) {
            const trimmed = condition.trim();
            if (!trimmed)
                continue;

            // Check if condition matches pattern: field:operation, field:operation>=threshold, or just field
            const conditionPattern = /^(artist|title|album|artistWithTitle|artistInTitle)(:(match|contains|similarity>=\d*\.?\d+))?$/;
            if (!conditionPattern.test(trimmed)) {
                return {
                    isValid: false,
                    error: `Invalid condition: "${trimmed}". Expected format: field[:operation]`,
                    suggestions: [
                        'Use fields: artist, title, album, artistWithTitle, artistInTitle',
                        'Use operations: :match, :contains, :similarity>=0.8',
                        'Combine with AND/OR: artist:match AND title:contains',
                        'Incomplete fields like "artist" are also valid'
                    ]
                };
            }
        }

        return { isValid: true };
    }, []);

    // Get filtered suggestions based on current input
    const getFilteredSuggestions = useCallback((inputText: string): AutocompleteSuggestion[] => {
        const lastWord = inputText.split(/\s+/).pop() || '';
        const beforeLastWord = inputText.slice(0, inputText.lastIndexOf(lastWord));

        // If the last word starts with a field name, suggest operations
        const fieldMatch = /^(artist|title|album|artistWithTitle|artistInTitle)$/.exec(lastWord);
        if (fieldMatch) {
            return OPERATION_SUGGESTIONS;
        }

        // If we have a complete condition, suggest combinators
        const hasCompleteCondition = /^(artist|title|album|artistWithTitle|artistInTitle)(:(match|contains|similarity>=\d*\.?\d+))?$/.test(lastWord);
        if (hasCompleteCondition && beforeLastWord.trim()) {
            return COMBINATOR_SUGGESTIONS;
        }

        // Default: show all suggestions that match the input
        return ALL_SUGGESTIONS.filter(suggestion => 
            suggestion.label.toLowerCase().includes(lastWord.toLowerCase()) ||
            suggestion.value.toLowerCase().includes(lastWord.toLowerCase())
        );
    }, []);

    const handleInputChange = useCallback((_event: React.SyntheticEvent, newInputValue: string) => {
        setInputValue(newInputValue);
        const validation = validateExpression(newInputValue);
        setValidationResult(validation);
    }, [validateExpression]);

    const handleSelectionChange = useCallback((_event: React.SyntheticEvent, value: string | AutocompleteSuggestion | null) => {
        const suggestion = typeof value === 'string' ? null : value;
        if (suggestion) {
            const words = inputValue.split(/\s+/);
            const lastWord = words.pop() || '';
            const beforeLastWord = words.join(' ');
            
            let newValue: string;
            if (suggestion.category === 'combinator') {
                newValue = inputValue + suggestion.value;
            } else if (suggestion.category === 'operation' && /^(artist|title|album|artistWithTitle|artistInTitle)$/.test(lastWord)) {
                newValue = beforeLastWord + (beforeLastWord ? ' ' : '') + lastWord + suggestion.value;
            } else {
                newValue = beforeLastWord + (beforeLastWord ? ' ' : '') + suggestion.value;
            }
            
            setInputValue(newValue);
            onChange(newValue);
            const validation = validateExpression(newValue);
            setValidationResult(validation);
        }
    }, [inputValue, onChange, validateExpression]);

    const handleBlur = useCallback(() => {
        onChange(inputValue);
    }, [inputValue, onChange]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            onChange(inputValue);
        }
    }, [inputValue, onChange]);

    const filteredSuggestions = useMemo(() => {
        return getFilteredSuggestions(inputValue);
    }, [inputValue, getFilteredSuggestions]);

    const getOptionLabel = useCallback((option: string | AutocompleteSuggestion) => {
        return typeof option === 'string' ? option : option.label;
    }, []);

    const renderInput = useCallback((params: any) => (
        <TextField
            {...params}
            ref={inputRef}
            placeholder={placeholder}
            error={!!hasError}
            helperText={hasError ? errorMessage : ''}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            fullWidth
        />
    ), [placeholder, hasError, errorMessage, handleBlur, handleKeyDown]);

    const renderOption = useCallback((props: any, option: AutocompleteSuggestion) => (
        <Paper component="li" {...props}>
            <CustomOption option={option} />
        </Paper>
    ), []);

    const hasError = error || !validationResult.isValid;
    const errorMessage = error || validationResult.error;

    return (
        <Box>
            <Autocomplete
                freeSolo
                options={filteredSuggestions}
                getOptionLabel={getOptionLabel}
                inputValue={inputValue}
                onInputChange={handleInputChange}
                onChange={handleSelectionChange}
                disabled={disabled}
                size={size}
                renderInput={renderInput}
                renderOption={renderOption}
                PaperComponent={CustomPaper}
            />
            
            {/* Show suggestions for invalid expressions */}
            {validationResult.suggestions && validationResult.suggestions.length > 0 ? <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                    Suggestions:
                </Typography>
                {validationResult.suggestions.map((suggestion, index) => (
                    <Typography key={index} variant="body2" component="div">
                        • {suggestion}
                    </Typography>
                ))}
            </Alert> : null}
        </Box>
    );
};

export default ExpressionInput;
