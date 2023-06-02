import _ from 'lodash';
import { Solution } from './solution.js';

export abstract class Storage extends Solution {
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

    mergeProviderOptions(options, keyFields) {
        return _.defaults(
            _.omitBy(_.pick(options, ..._.keys(keyFields)), (value) => !value),
            _.pick(this.providerOptions, ..._.keys(keyFields)),
        );
    }
}