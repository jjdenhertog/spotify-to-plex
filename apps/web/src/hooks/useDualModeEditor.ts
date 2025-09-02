import { useState, useCallback, useRef } from 'react';
import { errorBoundary } from '@/helpers/errors/errorBoundary';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';

type ViewMode = 'ui' | 'json';

type UseDualModeEditorConfig<TJson, TUI> = {
    readonly loadEndpoint: string;
    readonly saveEndpoint: string;
    readonly validator: (data: TJson) => string | null;
    readonly jsonToUI: (json: TJson) => TUI;
    readonly uiToJSON: (ui: TUI) => TJson;
    readonly initialData: TJson;
};

export function useDualModeEditor<TJson, TUI>(config: UseDualModeEditorConfig<TJson, TUI>) {
    const [viewMode, setViewMode] = useState<ViewMode>('ui');
    const [jsonData, setJsonData] = useState<TJson>(config.initialData);
    const [uiData, setUIData] = useState<TUI>(config.jsonToUI(config.initialData));
    const [loading, setLoading] = useState(true);
    const [validationError, setValidationError] = useState<string>('');
    const editorRef = useRef<any>(null);

    // Load data from API
    const loadData = useCallback(() => {
        errorBoundary(async () => {
            setLoading(true);
            const response = await axios.get(config.loadEndpoint);
            const { data } = response;
            setJsonData(data);
            setUIData(config.jsonToUI(data));
            setLoading(false);
        }, () => {
            setLoading(false);
        });
    }, [config]);

    // Save data to API  
    const handleSave = useCallback(() => {
        errorBoundary(async () => {
            let currentData: TJson;

            if (viewMode === 'json') {
                // Get current content from Monaco editor
                currentData = editorRef.current?.getCurrentValue?.();
            } else {
                // Convert UI data to JSON format
                currentData = config.uiToJSON(uiData);
            }

            if (!currentData) {
                enqueueSnackbar('No valid data to save', { variant: 'error' });

                return;
            }

            // Validate data
            const validationErrorMsg = config.validator(currentData);
            if (validationErrorMsg) {
                setValidationError(validationErrorMsg);
                enqueueSnackbar(`Validation Error: ${validationErrorMsg}`, { variant: 'error' });

                return;
            }


            setValidationError('');

            await axios.post(config.saveEndpoint, currentData);
            enqueueSnackbar('Configuration saved successfully', { variant: 'success' });
            
            // Update local state
            setJsonData(currentData);
            setUIData(config.jsonToUI(currentData));
        });
    }, [viewMode, uiData, config]);

    // Reset to defaults
    const handleReset = useCallback(() => {
        // eslint-disable-next-line no-alert
        if (confirm('Reset to defaults? This will overwrite your current configuration.')) {
            loadData();
            setValidationError('');
        }
    }, [loadData]);

    // Handle view mode changes
    const handleViewModeChange = useCallback((_event: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
        if (newMode) {
            if (newMode !== viewMode) {
                // Convert data when switching modes
                if (newMode === 'json') {
                    // Switching to JSON - convert UI to JSON
                    const convertedData = config.uiToJSON(uiData);
                    setJsonData(convertedData);
                } else {
                    // Switching to UI - convert JSON to UI
                    const convertedData = config.jsonToUI(jsonData);
                    setUIData(convertedData);
                }
            }

            setViewMode(newMode);
        }
    }, [viewMode, uiData, jsonData, config]);

    // Handle UI data changes
    const handleUIDataChange = useCallback((newUIData: TUI) => {
        setUIData(newUIData);
        setValidationError('');
    }, []);

    // Handle JSON data changes  
    const handleJSONDataChange = useCallback((newJsonData: TJson) => {
        setJsonData(newJsonData);
        setValidationError('');
    }, []);

    return {
        viewMode,
        jsonData,
        uiData,
        loading,
        validationError,
        editorRef,
        loadData,
        handleSave,
        handleReset,
        handleViewModeChange,
        handleUIDataChange,
        handleJSONDataChange
    };
}