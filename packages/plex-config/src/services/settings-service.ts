import { StorageAdapter } from '../storage/storage-adapter';
import { PlexSettings, PlexSettingsUpdate } from '../types/settings';
import { PlexEventEmitter } from '../core/event-emitter';
import { SettingsUpdatedEvent } from '../types/events';

export class SettingsService {
  private cache: PlexSettings | null = null;

  constructor(
    private readonly storage: StorageAdapter,
    private readonly eventEmitter: PlexEventEmitter
  ) {}

  async getSettings(): Promise<PlexSettings> {
    if (this.cache === null) {
      const settings = await this.storage.read<PlexSettings>('settings');
      this.cache = settings ?? {};
    }
    return this.cache;
  }

  async updateSettings(updates: PlexSettingsUpdate): Promise<PlexSettings> {
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

  async hasValidConnection(): Promise<boolean> {
    const settings = await this.getSettings();
    return !!(settings.uri && settings.token);
  }

  async clearSettings(): Promise<void> {
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

  // Synchronous getter for backward compatibility (uses cached value)
  getCachedSettings(): PlexSettings {
    return this.cache ?? {};
  }

  // Pre-load cache for synchronous access
  async preloadCache(): Promise<void> {
    await this.getSettings();
  }
}