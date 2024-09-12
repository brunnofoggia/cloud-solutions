import _debug from 'debug';
const debug = _debug('solutions:storage:ftp');

import { Interface as ReadLineInterface } from 'readline';

import { FileInfoInterface, ReadStreamOptions, StorageInterface } from '../../common/interfaces/storage.interface';
import { Storage } from '../../common/abstract/storage';

export class Ftp extends Storage implements StorageInterface {
    protected defaultOptions: any = {};

    async readContent(path_, options: any = {}) {}

    async readStream(filePath, options: Partial<ReadStreamOptions> = {}): Promise<ReadLineInterface | NodeJS.ReadableStream> {
        return {} as never;
    }

    async sendContent(filePath, content, options: any = {}) {}

    async deleteFile(filePath, options: any = {}) {}

    async deleteDirectory(directoryPath, options: any = {}) {}

    async readDirectory(directoryPath = '', options: any = {}): Promise<any> {}

    async sendStream(filePath, options: any = {}) {}

    async getFileInfo(path_, options: any = {}): Promise<FileInfoInterface> {
        return {
            contentLength: 0,
            etag: '',
        };
    }
}
