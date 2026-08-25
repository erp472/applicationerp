import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly root: string;

  constructor() {
    this.root = process.env.STORAGE_PATH
      ? path.resolve(process.env.STORAGE_PATH)
      : path.resolve('./storage');
  }

  async savePdf(relPath: string, buffer: Buffer): Promise<string> {
    const abs = path.join(this.root, relPath);
    const dir = path.dirname(abs);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(abs, buffer);
    this.logger.log(`PDF guardado: ${abs}`);
    return relPath;
  }

  absolutePath(relPath: string): string {
    return path.join(this.root, relPath);
  }

  async exists(relPath: string): Promise<boolean> {
    try {
      await fs.promises.access(path.join(this.root, relPath));
      return true;
    } catch {
      return false;
    }
  }
}
