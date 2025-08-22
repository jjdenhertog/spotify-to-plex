import { PlexConfigEvent } from '../types/events';

type EventListener<T = any> = (event: T) => void;

export class PlexEventEmitter {
  private listeners: Map<string, Set<EventListener>> = new Map();

  on<T extends PlexConfigEvent>(
    type: T['type'],
    listener: EventListener<T>
  ): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener as EventListener);
  }

  off<T extends PlexConfigEvent>(
    type: T['type'],
    listener: EventListener<T>
  ): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(listener as EventListener);
      if (listeners.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  emit<T extends PlexConfigEvent>(type: T['type'], event: T): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${type}:`, error);
        }
      });
    }
  }

  removeAllListeners(type?: string): void {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
    }
  }

  listenerCount(type: string): number {
    const listeners = this.listeners.get(type);
    return listeners ? listeners.size : 0;
  }
}