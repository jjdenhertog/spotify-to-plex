
export function getErrorStack(e: any): string | undefined {
    return e.response?.data.stack || e.response?.data.error_stack || e.stack;
}
