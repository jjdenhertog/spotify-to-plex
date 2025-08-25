import { StorageAdapter } from '../storage/storage-adapter';
import { PlexSettings, PlexSettingsUpdate } from '../types/settings';
import { PlexEventEmitter } from '../core/event-emitter';
import { SettingsUpdatedEvent } from '../types/events';

export class SettingsService {
    private cache: PlexSettings | null = null;

    public constructor(
    private readonly storage: StorageAdapter,
    private readonly eventEmitter: PlexEventEmitter
    ) {}

    public async getSettings(): Promise<PlexSettings> {
        if (this.cache === null) {
            const settings = await this.storage.read<PlexSettings>('settings');
            this.cache = settings ?? {};
        }

        return this.cache;
    }

    public async updateSettings(updates: PlexSettingsUpdate): Promise<PlexSettings> {
        const current = await this.getSettings();
        const updated = { ...current, ...updates };
    
        await this.storage.write('settings', updated);
    
        // Update cache
        this.cache = updated;
    
        // Emit event
        const event: SettingsUpdatedEvent = {
            type: 'settings:updated',
            timestamp: Date.now(),
            data: updated,
            previous: current
        };
    
        this.eventEmitter.emit('settings:updated', event);

        return updated;
    }

    public async hasValidConnection(): Promise<boolean> {
        const settings = await this.getSettings();

        return !!(settings.uri && settings.token);
    }

    public async clearSettings(): Promise<void> {
        const current = await this.getSettings();
    
        await this.storage.delete('settings');
        this.cache = {};
    
        const event: SettingsUpdatedEvent = {
            type: 'settings:updated',
            timestamp: Date.now(),
            data: {},
            previous: current
        };
    
        this.eventEmitter.emit('settings:updated', event);
    }


    // Pre-load cache for synchronous access
    public async preloadCache(): Promise<void> {
        await this.getSettings();
    }
}