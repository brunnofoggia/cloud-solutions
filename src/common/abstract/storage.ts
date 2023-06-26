import _, { defaultsDeep, keys, omit } from 'lodash';
import { Solution } from './solution';

export abstract class Storage extends Solution {
    protected defaultOptions: any = {
        params: {
            streamQueueSize: 4,
            streamPartSize: 5 * 1024 * 1024,
        },
    };

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

    mergeStorageOptions(options = {}, keyFields) {
        return defaultsDeep({}, omit(this.getOptions(), 'params'), omit(options, 'params', ...keys(keyFields)));
    }

    async readDirectory(directoryPath = '', options: any = {}) {
        return [];
    }

    async getDirectoryContentLength(directoryPath = '', options: any = {}) {
        try {
            const objects = await this.readDirectory(directoryPath, options);
            return objects?.length || 0;
        } catch (error) {
            return 0;
        }
    }

    async checkDirectoryContentLength(directoryPath = '', options: any = {}) {
        return (await this.getDirectoryContentLength(directoryPath, options)) > 0;
    }

    // TODO: alias [to be removed]
    async checkDirectoryExists(directoryPath = '', options: any = {}) {
        return await this.checkDirectoryContentLength(directoryPath, options);
    }
}
