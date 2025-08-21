
export function getErrorMessage(e: unknown): string {
    const error = e as { response?: { data?: { error?: string; message?: string } }; message?: string };
    const message = error.response?.data?.error || error.response?.data?.message || error.message;
    if (message)
        return message;

    try {
        const data = JSON.parse(e);
        if (data.error) {
            return data.error;
        }
 
            return "Something went terribly wrong";
        
    } catch (_e) {
        return "Something went extremely wrong";
    }
}
