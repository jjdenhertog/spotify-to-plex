import React, { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Box, Paper, Alert, Typography } from '@mui/material';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

type MonacoJsonEditorProps = {
    readonly value: any;
    readonly onChange?: (value: any) => void;
    readonly schema?: any; // JSON Schema for validation
    readonly height?: number;
    readonly readOnly?: boolean;
    readonly error?: string;
};

export type MonacoJsonEditorHandle = {
    getCurrentValue: () => any;
};

const MonacoJsonEditor = forwardRef<MonacoJsonEditorHandle, MonacoJsonEditorProps>((props, ref) => {
    const {
        value,
        onChange,
        schema,
        height = 400,
        readOnly = false,
        error
    } = props;

    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();

    const handleEditorDidMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => {
        editorRef.current = editor;

        // Configure JSON schema validation if provided
        if (schema) {
            monacoInstance.languages.json.jsonDefaults.setDiagnosticsOptions({
                validate: true,
                schemaValidation: 'error',
                schemas: [{
                    uri: 'http://internal/schema.json',
                    fileMatch: ['*'],
                    schema
                }]
            });
        }

        // Configure editor theme and options
        monacoInstance.editor.defineTheme('custom-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#1e1e1e',
            }
        });

        monacoInstance.editor.setTheme('custom-dark');
    }, [schema]);

    const handleEditorChange = useCallback((value: string | undefined) => {
        if (!value || !onChange) return;

        try {
            const parsedValue = JSON.parse(value);
            onChange(parsedValue);
        } catch {
            // Don't call onChange with invalid JSON - let Monaco handle validation visually
        }
    }, [onChange]);

    // Get current JSON value
    const getCurrentValue = useCallback(() => {
        if (!editorRef.current) return null;

        const content = editorRef.current.getValue();
        try {
            return JSON.parse(content);
        } catch {
            return null;
        }
    }, []);

    // Expose getCurrentValue through ref
    useImperativeHandle(ref, () => ({
        getCurrentValue
    }));

    const jsonString = React.useMemo(() => {
        return JSON.stringify(value, null, 2);
    }, [value]);

    return (
        <Box>
            {error ? <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2">
                    <strong>Validation Error:</strong><br />
                    {error}
                </Typography>
            </Alert> : null}

            <Paper variant="outlined">
                <Editor
                    height={`${height}px`}
                    language="json"
                    value={jsonString}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    options={{
                        readOnly,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        lineNumbers: 'on',
                        roundedSelection: false,
                        scrollbar: {
                            alwaysConsumeMouseWheel: false
                        },
                        automaticLayout: true,
                        folding: true,
                        bracketPairColorization: {
                            enabled: true
                        },
                        formatOnPaste: true,
                        formatOnType: true
                    }}
                />
            </Paper>
        </Box>
    );
});

MonacoJsonEditor.displayName = 'MonacoJsonEditor';

export default MonacoJsonEditor;