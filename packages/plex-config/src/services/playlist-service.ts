import { StorageAdapter } from '../storage/storage-adapter';
import { PlexPlaylists, PlaylistUpdate, PlaylistItem } from '../types/playlists';
import { PlexEventEmitter } from '../core/event-emitter';
import { PlaylistUpdatedEvent } from '../types/events';

export class PlaylistService {
  private cache: PlexPlaylists | null = null;

  constructor(
    private readonly storage: StorageAdapter,
    private readonly eventEmitter: PlexEventEmitter
  ) {}

  async getPlaylists(): Promise<PlexPlaylists> {
    if (this.cache === null) {
      const playlists = await this.storage.read<PlexPlaylists>('playlists');
      this.cache = playlists ?? { data: [] };
    }
    return this.cache;
  }

  async addPlaylist(item: PlaylistUpdate): Promise<void> {
    const current = await this.getPlaylists();
    const existingData = current.data ?? [];
    
    // Remove existing item with same id
    const filtered = existingData.filter(existing => existing.id !== item.id);
    const newItem: PlaylistItem = {
      type: item.type,
      id: item.id,
      plex: item.plex
    };
    
    const updated: PlexPlaylists = { 
      data: [...filtered, newItem] 
    };
    
    await this.storage.write('playlists', updated);
    
    // Update cache
    this.cache = updated;
    
    // Emit event
    const event: PlaylistUpdatedEvent = {
      type: 'playlist:updated',
      timestamp: Date.now(),
      data: newItem,
      action: 'added'
    };
    
    this.eventEmitter.emit('playlist:updated', event);
  }

  async removePlaylist(id: string): Promise<void> {
    const current = await this.getPlaylists();
    const existingData = current.data ?? [];
    const item = existingData.find(p => p.id === id);
    
    if (!item) return;
    
    const filtered = existingData.filter(existing => existing.id !== id);
    const updated: PlexPlaylists = { data: filtered };
    
    await this.storage.write('playlists', updated);
    
    // Update cache
    this.cache = updated;
    
    // Emit event
    const event: PlaylistUpdatedEvent = {
      type: 'playlist:updated',
      timestamp: Date.now(),
      data: item,
      action: 'removed'
    };
    
    this.eventEmitter.emit('playlist:updated', event);
  }

  async updatePlaylist(id: string, updates: Partial<PlaylistUpdate>): Promise<void> {
    const current = await this.getPlaylists();
    const existingData = current.data ?? [];
    const index = existingData.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error(`Playlist with id ${id} not found`);
    }
    
    const updatedItem: PlaylistItem = {
      ...existingData[index]!,
      ...(updates.type && { type: updates.type }),
      ...(updates.id && { id: updates.id }),
      ...(updates.plex && { plex: updates.plex })
    };
    
    const newData = [...existingData];
    newData[index] = updatedItem;
    
    const updated: PlexPlaylists = { data: newData };
    
    await this.storage.write('playlists', updated);
    
    // Update cache
    this.cache = updated;
    
    // Emit event
    const event: PlaylistUpdatedEvent = {
      type: 'playlist:updated',
      timestamp: Date.now(),
      data: updatedItem,
      action: 'updated'
    };
    
    this.eventEmitter.emit('playlist:updated', event);
  }

  async clearPlaylists(): Promise<void> {
    await this.storage.delete('playlists');
    this.cache = { data: [] };
    
    // We could emit a clear event if needed
  }

  // Synchronous getter for backward compatibility (uses cached value)
  getCachedPlaylists(): PlexPlaylists {
    return this.cache ?? { data: [] };
  }

  // Pre-load cache for synchronous access
  async preloadCache(): Promise<void> {
    await this.getPlaylists();
  }
}