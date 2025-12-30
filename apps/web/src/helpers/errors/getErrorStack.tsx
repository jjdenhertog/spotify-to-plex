
export function getErrorStack(e: unknown) {
    const error = e as { response?: { data?: { stack?: string; error_stack?: string } }; stack?: string };
    
    return error.response?.data?.stack || error.response?.data?.error_stack || error.stack;
}
