import React, { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { 
    Box, 
    Paper, 
    Alert, 
    Typography, 
    IconButton, 
    Tooltip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    GetApp as ImportIcon,
    Publish as ExportIcon,
    MoreVert as MoreIcon,
    FileCopy as CopyIcon,
    ContentPaste as PasteIcon
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { enqueueSnackbar } from 'notistack';

type EnhancedMonacoJsonEditorProps = {
    readonly value: any;
    readonly onChange?: (value: any) => void;
    readonly schema?: any; // JSON Schema for validation
    readonly height?: number;
    readonly readOnly?: boolean;
    readonly error?: string;
    readonly enableImportExport?: boolean;
};

export type EnhancedMonacoJsonEditorHandle = {
    getCurrentValue: () => any;
    exportToFile: () => void;
    copyToClipboard: () => void;
};

const EnhancedMonacoJsonEditor = forwardRef<EnhancedMonacoJsonEditorHandle, EnhancedMonacoJsonEditorProps>((props, ref) => {
    const {
        value,
        onChange,
        schema,
        height = 400,
        readOnly = false,
        error,
        enableImportExport = true
    } = props;

    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

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
            rules: [
                // Enhanced syntax highlighting for expressions
                { token: 'string.key.json', foreground: '9CDCFE' },
                { token: 'string.value.json', foreground: 'CE9178' },
                { token: 'number.json', foreground: 'B5CEA8' },
                { token: 'keyword.json', foreground: 'C586C0' }
            ],
            colors: {
                'editor.background': '#1e1e1e',
                'editorLineNumber.foreground': '#858585',
                'editorLineNumber.activeForeground': '#c6c6c6'
            }
        });

        monacoInstance.editor.setTheme('custom-dark');

        // Add custom actions for import/export
        if (enableImportExport) {
            editor.addAction({
                id: 'import-json',
                label: 'Import JSON File',
                keybindings: [
                    /* eslint-disable-next-line no-bitwise */
                    monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyI
                ],
                run: () => {
                    fileInputRef.current?.click();
                }
            });

            editor.addAction({
                id: 'export-json',
                label: 'Export JSON File',
                keybindings: [
                    /* eslint-disable-next-line no-bitwise */
                    monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyE
                ],
                run: () => {
                    exportToFile();
                }
            });

            editor.addAction({
                id: 'copy-json',
                label: 'Copy to Clipboard',
                keybindings: [
                    /* eslint-disable-next-line no-bitwise */
                    monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyC
                ],
                run: () => {
                    copyToClipboard();
                }
            });
        }
    }, [schema, enableImportExport]);

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

    // Export to file
    const exportToFile = useCallback(() => {
        if (!editorRef.current) return;

        const content = editorRef.current.getValue();
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `match-filters-${new Date().toISOString()
            .split('T')[0]}.json`;
        document.body.append(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        enqueueSnackbar('Configuration exported successfully', { variant: 'success' });
    }, []);

    // Copy to clipboard
    const copyToClipboard = useCallback(async () => {
        if (!editorRef.current) return;

        const content = editorRef.current.getValue();
        try {
            await navigator.clipboard.writeText(content);
            enqueueSnackbar('Configuration copied to clipboard', { variant: 'success' });
        } catch (_err) {
            enqueueSnackbar('Failed to copy to clipboard', { variant: 'error' });
        }
    }, []);

    // Import from file
    const handleFileImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            try {
                const parsed = JSON.parse(content);
                if (onChange) {
                    onChange(parsed);
                }

                enqueueSnackbar('Configuration imported successfully', { variant: 'success' });
            } catch (_err) {
                enqueueSnackbar('Invalid JSON file', { variant: 'error' });
            }
        };
        reader.readAsText(file);

        // Reset file input
        event.target.value = '';
    }, [onChange]);

    // Paste from clipboard
    const pasteFromClipboard = useCallback(async () => {
        try {
            const content = await navigator.clipboard.readText();
            const parsed = JSON.parse(content);
            if (onChange) {
                onChange(parsed);
            }

            enqueueSnackbar('Configuration pasted from clipboard', { variant: 'success' });
        } catch (_err) {
            enqueueSnackbar('Invalid JSON in clipboard', { variant: 'error' });
        }
    }, [onChange]);

    // Menu handlers
    const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleMenuClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    // Expose methods through ref
    useImperativeHandle(ref, () => ({
        getCurrentValue,
        exportToFile,
        copyToClipboard
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

            <Paper variant="outlined" sx={{ position: 'relative' }}>
                {/* Toolbar */}
                {enableImportExport && !readOnly ? <Box
                    sx={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8, 
                        zIndex: 10,
                        display: 'flex',
                        gap: 0.5
                    }}>
                    <Tooltip title="Import/Export Options">
                        <IconButton
                            size="small"
                            onClick={handleMenuOpen}
                            sx={{
                                bgcolor: 'background.paper',
                                boxShadow: 1,
                                '&:hover': { bgcolor: 'action.hover' }
                            }}
                            >
                            <MoreIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box> : null}

                <Editor
                    height={`${height}px`}
                    language="json"
                    value={jsonString}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    options={{
                        readOnly,
                        minimap: { enabled: height > 400 },
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
                        formatOnType: true,
                        wordWrap: 'on',
                        wrappingIndent: 'indent',
                        renderLineHighlight: 'all',
                        cursorSmoothCaretAnimation: 'on',
                        smoothScrolling: true,
                        contextmenu: enableImportExport,
                        links: false
                    }}
                />

                {/* Hidden file input for import */}
                <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileImport} />
            </Paper>

            {/* Import/Export Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: { minWidth: 200 }
                }}
            >
                <MenuItem onClick={() => { handleMenuClose(); fileInputRef.current?.click(); }}>
                    <ListItemIcon>
                        <ImportIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Import JSON File</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); exportToFile(); }}>
                    <ListItemIcon>
                        <ExportIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Export JSON File</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); copyToClipboard(); }}>
                    <ListItemIcon>
                        <CopyIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Copy to Clipboard</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); pasteFromClipboard(); }}>
                    <ListItemIcon>
                        <PasteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                        Paste from Clipboard
                    </ListItemText>
                </MenuItem>
            </Menu>

            {/* Footer help text */}
            {enableImportExport ? <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                    <strong>Keyboard shortcuts:</strong> Ctrl+I (Import), Ctrl+E (Export), Ctrl+Shift+C (Copy)
                </Typography>
            </Box> : null}
        </Box>
    );
});

EnhancedMonacoJsonEditor.displayName = 'EnhancedMonacoJsonEditor';

export default EnhancedMonacoJsonEditor;