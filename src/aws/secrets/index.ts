import AWS from 'aws-sdk';
import { intersection, keys } from 'lodash';

import { Secrets } from '../../common/abstract/secrets';
import { SecretsInterface } from '../../common/interfaces/secrets.interface';
import { providerConfig, keyFields } from '../index';
import { decryptSecretData } from './functions/kms';

export class ParameterStore extends Secrets implements SecretsInterface {
    public defaultOptions: any = {
        cache: true,
        WithDecryption: true,
    };
    protected instance;

    async initialize(options: any = {}) {
        super.initialize(options);
        this.instance = this.createInstance(options);
    }

    getInstance(options: any = {}) {
        if (intersection(keys(options), keys(keyFields)).length > 0) {
            const instance = this.createInstance(options);
            providerConfig(this.getProviderOptions(keyFields));
            return instance;
        }
        return this.instance;
    }

    createInstance(options: any = {}) {
        providerConfig(this.mergeProviderOptions(options, keyFields));
        return new AWS.SSM({});
    }

    async getSecretValue(path: string) {
        return super.get(path, async (path) => await this._getSecretValue(path));
    }

    async getValue(path: string) {
        return super.get(path, async (path) => (await this.getParameterFromCloud(path))?.Value);
    }

    async _getSecretValue(path) {
        const param = await this.getParameterFromCloud(path);
        if (param?.Value && param?.ARN) {
            let data = param.Value;
            if (!this.getOptions().WithDecryption) {
                data = await decryptSecretData(param.Value, param.ARN);
            }
            return data;
        } else {
            throw new Error(`secret not found "${path}"`);
        }
    }

    async request(methodName, parameters) {
        const service = this.getInstance();
        const parameterPromise = service[methodName](parameters).promise();

        return await parameterPromise;
    }

    getParameterFromCloud = async (name) => {
        try {
            return (
                await this.request('getParameter', {
                    Name: name,
                    WithDecryption: this.getOptions().WithDecryption,
                })
            ).Parameter;
        } catch (error) {
            error.message = `"${name}": ${error.message}`;
            throw error;
        }
    };
}
