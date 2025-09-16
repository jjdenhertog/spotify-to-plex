import { getSettings } from './getSettings';

export async function hasValidConnection(): Promise<boolean> {
    const settings = await getSettings();

    return Boolean(settings.uri && settings.token);
}