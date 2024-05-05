
export function getErrorMessage(e: any): string {
    let message = e.response?.data.error || e.response?.data.message || e.message;
    if (message)
        return message;

    try {
        let data = JSON.parse(e);
        if (data.error) {
            return data.error;
        } else {
            return "Something went terribly wrong";
        }
    } catch (e) {
        return "Something went extremely wrong";
    }
}
