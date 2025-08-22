import { ensureDir, readFile, writeFile, pathExists, remove } from 'fs-extra';
import { join } from 'node:path';
import { StorageAdapter } from './storage-adapter';
import { StorageError } from '../utils/storage-error';

export class FileStorageAdapter implements StorageAdapter {
  private readonly fileMappings: Record<string, string> = {
    settings: 'plex.json',
    playlists: 'playlists.json'
  };

  public constructor(private readonly baseDir: string) {}

  public async read<T>(key: string): Promise<T | null> {
    try {
      const fileName = this.fileMappings[key] || `${key}.json`;
      const filePath = join(this.baseDir, fileName);
      
      const exists = await pathExists(filePath);
      if (!exists) {
        return null;
      }

      const content = await readFile(filePath, 'utf8');

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

  public async write(key: string, data: unknown): Promise<void> {
    try {
      await ensureDir(this.baseDir);
      
      const fileName = this.fileMappings[key] || `${key}.json`;
      const filePath = join(this.baseDir, fileName);
      
      // Write to a temporary file first for atomic operation
      const tempPath = `${filePath}.tmp`;
      await writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
      
      // Atomic rename
      const fs = await import('node:fs');
      await fs.promises.rename(tempPath, filePath);
    } catch (error) {
      throw new StorageError(
        `Failed to write ${key}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const fileName = this.fileMappings[key] || `${key}.json`;
      const filePath = join(this.baseDir, fileName);

      return await pathExists(filePath);
    } catch {
      return false;
    }
  }

  public async delete(key: string): Promise<void> {
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