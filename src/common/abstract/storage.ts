import { defaultsDeep, keys, omit } from 'lodash';
import { Solution } from './solution';
import { CompareSizeOptionsInterface, StorageInterface } from '../interfaces/storage.interface';

export const storageInternalOptions = ['getRawStream'];

export abstract class Storage extends Solution {
    protected defaultOptions: any = {
        params: {
            streamQueueSize: 4,
            streamPartSize: 5 * 1024 * 1024,
        },
    };

    createDirIfNotExists(path) {
        null;
    }

    checkOptions() {
        if (!this.options.Bucket) {
            throw new Error('Missing option "Bucket" for storage solution');
        }
        return true;
    }

    async sendContent(path, content, params: any = {}, retry = 3) {
        try {
            await this._sendContent(path, content, params);
        } catch (err) {
            if (retry) {
                return await this.sendContent(path, content, params, retry - 1);
            }
            throw err;
        }
    }

    async _sendContent(path, content, params: any = {}) {
        null;
    }

    mergeStorageOptions(options = {}, keyFieldsToOmit) {
        const omitFields = [...storageInternalOptions, ...keys(keyFieldsToOmit)];
        return defaultsDeep({}, omit(this.getOptions(), 'params'), this.filterOptions(options, omitFields));
    }

    filterOptions(options = {}, keyFieldsToOmit) {
        return omit(options, 'params', ...keys(keyFieldsToOmit));
    }

    async getDirectoryContentLength(directoryPath = '', options: any = {}) {
        try {
            const objects = await this['readDirectory'](directoryPath, options);
            return objects?.length || 0;
        } catch (error) {
            return 0;
        }
    }

    // can be used to check if a file existe or directory exists (directory must have files inside)
    async checkPathExists(directoryPath = '', options: any = {}) {
        const contentLength = await this.getDirectoryContentLength(directoryPath, options);
        return contentLength > 0;
    }

    async compareSize(pathA, pathB, options: Partial<CompareSizeOptionsInterface> = {}): Promise<boolean> {
        const storageA = (options.storageA || this) as StorageInterface;
        const storageB = (options.storageB || this) as StorageInterface;

        const FileAInfo = await storageA.getFileInfo(pathA);
        const fileBInfo = await storageB.getFileInfo(pathB);
        return FileAInfo.contentLength === fileBInfo.contentLength;
    }

    filterFilesOnly(files: string[]) {
        return files.filter((item) => !item.endsWith('/'));
    }

    // TODO: alias [to be removed]
    async checkDirectoryContentLength(directoryPath = '', options: any = {}) {
        return await this.checkPathExists(directoryPath, options);
    }

    async checkDirectoryExists(directoryPath = '', options: any = {}) {
        return await this.checkPathExists(directoryPath, options);
    }

    async copyFile(pathFrom, pathTo, options: any = {}): Promise<void> {
        throw new Error('Method not implemented');
    }
}
