export type StorageAdapter = {
  read: <T>(key: string) => Promise<T | null>;
  write: (key: string, data: unknown) => Promise<void>;
  exists: (key: string) => Promise<boolean>;
  delete: (key: string) => Promise<void>;
}