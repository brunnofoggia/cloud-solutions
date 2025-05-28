import { intersection, keys } from 'lodash';

import { Secrets } from '../../common/abstract/secrets';
import { SecretsInterface } from '../../common/interfaces/secrets.interface';
import { keyFields, libraries, providerConfig } from '../index';

export class ParameterStore extends Secrets implements SecretsInterface {
    protected libraries = libraries;
    public defaultOptions: any = {
        cache: true,
        WithDecryption: true,
    };
    protected instance;

    async initialize(options: any = {}) {
        await super.initialize(options);
        this.instance = await this.createInstance(options);
    }

    async getInstance(options: any = {}) {
        if (intersection(keys(options), keys(keyFields)).length > 0) {
            const instance = await this.createInstance(options);
            return instance;
        }
        return this.instance;
    }

    async createInstance(options: any = {}) {
        const SSMClient = this.getLibrary('SSMClient');

        const _options = this.mergeProviderOptions(options, keyFields);
        const config = await providerConfig(_options);

        return new SSMClient(config);
    }

    async _getSecretValue(path) {
        const param = await this.getParameterFromCloud(path);
        if (param?.Value && param?.ARN) {
            const data = param.Value;
            return data;
        } else {
            throw new Error(`secret not found "${path}"`);
        }
    }

    async request(parameters) {
        const instance = await this.getInstance();
        const parameterPromise = instance.send(parameters);

        return await parameterPromise;
    }

    _buildCommand(name) {
        const GetParameterCommand = this.getLibrary('SSMGetParameterCommand');
        return new GetParameterCommand({
            Name: name,
            WithDecryption: this.getOptions().WithDecryption,
        });
    }

    async getParameterFromCloud(name) {
        try {
            const command = this._buildCommand(name);

            return (await this.request(command)).Parameter;
        } catch (error) {
            error.message = `"${name}": ${error.message}`;
            throw error;
        }
    }
}
