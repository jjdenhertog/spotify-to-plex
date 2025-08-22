export function getErrorMessage(e) {
    const error = e;
    const message = error.response?.data?.error || error.response?.data?.message || error.message;
    if (message)
        return message;
    // Type guard to check if the value is a string before parsing
    if (typeof e === 'string') {
        try {
            const data = JSON.parse(e);
            if (data && typeof data === 'object' && data.error) {
                return typeof data.error === 'string' ? data.error : String(data.error);
            }
        }
        catch (_e) {
            // If parsing fails, treat the string as the error message itself
            return e;
        }
    }
    // Handle case where e is already an object with an error property
    if (e && typeof e === 'object' && 'error' in e) {
        const errorValue = e.error;
        if (typeof errorValue === 'string') {
            return errorValue;
        }
    }
    return "Something went terribly wrong";
}
//# sourceMappingURL=getErrorMessage.jsx.map