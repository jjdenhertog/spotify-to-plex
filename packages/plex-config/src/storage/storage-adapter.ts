export interface StorageAdapter {
  read<T>(key: string): Promise<T | null>;
  write<T>(key: string, data: T): Promise<void>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
}