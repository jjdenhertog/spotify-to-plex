import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import ErrorProvider from '../../src/components/ErrorProvider/ErrorProvider';

// Create a theme for testing
const theme = createTheme({
    palette: {
        mode: 'light',
    },
});

// Create a custom render function that includes providers
type CustomRenderOptions = {
  withErrorProvider?: boolean;
  withSnackbar?: boolean;
} & Omit<RenderOptions, 'wrapper'>

const AllTheProviders = ({ 
    children, 
    withErrorProvider = true, 
    withSnackbar = true 
}: { 
  readonly children: React.ReactNode;
  readonly withErrorProvider?: boolean;
  readonly withSnackbar?: boolean;
}) => {
    let component = (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );

    if (withSnackbar) {
        component = (
            <SnackbarProvider maxSnack={3}>
                {component}
            </SnackbarProvider>
        );
    }

    if (withErrorProvider) {
        component = (
            <ErrorProvider>
                {component}
            </ErrorProvider>
        );
    }

    return component;
};

const customRender = (
    ui: ReactElement,
    options?: CustomRenderOptions
) => {
    const { withErrorProvider = true, withSnackbar = true, ...renderOptions } = options || {};
  
    return render(ui, {
        wrapper: ({ children }) => (
            <AllTheProviders withErrorProvider={withErrorProvider} withSnackbar={withSnackbar}>
                {children}
            </AllTheProviders>
        ),
        ...renderOptions,
    });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
export { theme };