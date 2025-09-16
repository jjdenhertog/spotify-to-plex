import { useState, useCallback } from 'react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { errorBoundary } from '../helpers/errors/errorBoundary';

export function useConfigEditor<T>(endpoint: string, validator?: (data: T) => string | null) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [validationError, setValidationError] = useState<string>('');

    const loadData = useCallback(async () => {
        errorBoundary(async () => {
            setLoading(true);
            const response = await axios.get(endpoint);
            setData(response.data);
            setLoading(false);
        }, () => {
            setLoading(false);
        });
    }, [endpoint]);

    const saveData = useCallback(async (dataToSave: T) => {
        errorBoundary(async () => {
            if (validator) {
                const validationErrorMsg = validator(dataToSave);
                if (validationErrorMsg) {
                    setValidationError(validationErrorMsg);
                    enqueueSnackbar(`Validation Error: ${validationErrorMsg}`, { variant: 'error' });

                    return;
                }
            }

            setValidationError('');
            await axios.post(endpoint, dataToSave);
            enqueueSnackbar('Configuration saved successfully', { variant: 'success' });
            setData(dataToSave);
        });
    }, [endpoint, validator]);

    return {
        data,
        loading,
        validationError,
        loadData,
        saveData,
        setData
    };
}