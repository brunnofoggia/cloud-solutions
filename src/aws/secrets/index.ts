import AWS from 'aws-sdk';
import _ from 'lodash';

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
        if (_.intersection(_.keys(options), _.keys(keyFields)).length > 0) {
            const instance = this.createInstance(options);
            providerConfig(_.pick(this.providerOptions, ..._.keys(keyFields)));
            return instance;
        }
        return this.instance;
    }

    createInstance(options: any = {}) {
        providerConfig(_.defaults(
            _.pick(options, ..._.keys(keyFields)),
            _.pick(this.providerOptions, ..._.keys(keyFields)),
        ));

        const instance = new AWS.SSM({});

        return instance;
    }

    async getSecretValue(path: string) {
        return super.get(path, async (path) => await this._getSecretValue(path));
    }

    async getValue(path: string) {
        return super.get(path, async (path) => await this.getParamValue(path));
    }

    async _getSecretValue(path) {
        const param = await this.getParameterFromSsm(path);
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

    async getParamValue(path) {
        const param = await this.getParameterFromSsm(path);
        return param?.Value;
    }

    async request(methodName, parameters) {
        const service = this.getInstance();
        const parameterPromise = service[methodName](parameters).promise();

        return await parameterPromise;
    }

    getParameterFromSsm = async (name) => {
        try {
            return (await this
                .request(
                    "getParameter",
                    {
                        Name: name,
                        WithDecryption: this.getOptions().WithDecryption
                    }
                )).Parameter;
        } catch (error) {
            error.message = `"${name}": ${error.message}`;
            throw error;
        }
    };
}