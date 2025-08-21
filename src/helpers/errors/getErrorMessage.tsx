
export function getErrorMessage(e: any): string {
    const message = e.response?.data.error || e.response?.data.message || e.message;
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
