import { intersection, keys } from 'lodash';

import { Secrets } from '../../common/abstract/secrets';
import { SecretsInterface } from '../../common/interfaces/secrets.interface';
import { providerConfig, keyFields, libraries } from '../index';
import { decryptSecretData } from './functions/kms';

let AWS;
export class ParameterStore extends Secrets implements SecretsInterface {
    protected libraries = libraries;
    public defaultOptions: any = {
        cache: true,
        WithDecryption: true,
    };
    protected instance;

    async initialize(options: any = {}) {
        await super.initialize(options);
        AWS = this.getLibrary('AWS');
        this.instance = await this.createInstance(options);
    }

    async getInstance(options: any = {}) {
        if (intersection(keys(options), keys(keyFields)).length > 0) {
            const instance = await this.createInstance(options);
            await providerConfig(this.getProviderOptions(keyFields));
            return instance;
        }
        return this.instance;
    }

    async createInstance(options: any = {}) {
        await providerConfig(this.mergeProviderOptions(options, keyFields));
        return new AWS.SSM({});
    }

    async _getSecretValue(path) {
        const param = await this.getParameterFromCloud(path);
        if (param?.Value && param?.ARN) {
            let data = param.Value;
            if (!this.getOptions().WithDecryption) {
                data = await decryptSecretData(param.Value, param.ARN, AWS);
            }
            return data;
        } else {
            throw new Error(`secret not found "${path}"`);
        }
    }

    async request(methodName, parameters) {
        const service = await this.getInstance();
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
