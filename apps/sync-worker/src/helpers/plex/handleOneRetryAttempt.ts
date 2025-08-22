import { AxiosResponse } from "axios";

export async function handleOneRetryAttempt<T = any>(request: () => Promise<AxiosResponse<T>>) {
    try {
        const result = await request();

        return result;
    } catch (_e) {
        // Cooldown
        await (new Promise(resolve => { setTimeout(resolve, 2000); }));

        const result = await request();

        return result;
    }
}