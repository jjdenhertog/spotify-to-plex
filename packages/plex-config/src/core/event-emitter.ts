import { PlexConfigEvent } from '../types/events';

type EventListener<T = any> = (event: T) => void;

export class PlexEventEmitter {
    private readonly listeners = new Map<string, Set<EventListener>>();

    public on<T extends PlexConfigEvent>(
        type: T['type'],
        listener: EventListener<T>
    ): void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }

    this.listeners.get(type)!.add(listener as EventListener);
    }

    public off<T extends PlexConfigEvent>(
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

    public emit<T extends PlexConfigEvent>(type: T['type'], event: T): void {
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

    public removeAllListeners(type?: string): void {
        if (type) {
            this.listeners.delete(type);
        } else {
            this.listeners.clear();
        }
    }

    public listenerCount(type: string): number {
        const listeners = this.listeners.get(type);

        return listeners ? listeners.size : 0;
    }
}