import { ensureDir, readFile, writeFile, pathExists, remove } from 'fs-extra';
import { join } from 'path';
import { StorageAdapter } from './storage-adapter';
import { StorageError } from '../utils/error-handler';

export class FileStorageAdapter implements StorageAdapter {
  private readonly fileMappings: Record<string, string> = {
    settings: 'plex.json',
    playlists: 'playlists.json'
  };

  constructor(private readonly baseDir: string) {}

  async read<T>(key: string): Promise<T | null> {
    try {
      const fileName = this.fileMappings[key] || `${key}.json`;
      const filePath = join(this.baseDir, fileName);
      
      const exists = await pathExists(filePath);
      if (!exists) {
        return null;
      }

      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return null;
      }
      throw new StorageError(
        `Failed to read ${key}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async write<T>(key: string, data: T): Promise<void> {
    try {
      await ensureDir(this.baseDir);
      
      const fileName = this.fileMappings[key] || `${key}.json`;
      const filePath = join(this.baseDir, fileName);
      
      // Write to a temporary file first for atomic operation
      const tempPath = `${filePath}.tmp`;
      await writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      
      // Atomic rename
      const fs = await import('fs');
      await fs.promises.rename(tempPath, filePath);
    } catch (error) {
      throw new StorageError(
        `Failed to write ${key}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fileName = this.fileMappings[key] || `${key}.json`;
      const filePath = join(this.baseDir, fileName);
      return await pathExists(filePath);
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const fileName = this.fileMappings[key] || `${key}.json`;
      const filePath = join(this.baseDir, fileName);
      
      const exists = await pathExists(filePath);
      if (exists) {
        await remove(filePath);
      }
    } catch (error) {
      throw new StorageError(
        `Failed to delete ${key}`,
        error instanceof Error ? error : undefined
      );
    }
  }
}