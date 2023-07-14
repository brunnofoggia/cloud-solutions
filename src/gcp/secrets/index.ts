import _ from 'lodash';

import { Secrets } from '../../common/abstract/secrets';
import { SecretsInterface } from '../../common/interfaces/secrets.interface';
import { keyFields, providerConfig } from '../index';

let SecretManagerServiceClient;
export class SecretManager extends Secrets implements SecretsInterface {
    protected libraries = {
        SecretManagerServiceClient: {
            path: '@google-cloud/secret-manager',
            key: 'SecretManagerServiceClient',
        },
    };
    protected instance;

    async initialize(options: any = {}) {
        await super.initialize(options);
        SecretManagerServiceClient = this.getLibrary('SecretManagerServiceClient');
        this.checkOptions();
        this.instance = await this.createInstance(options);
    }

    checkOptions() {
        if (!this.getProjectId()) {
            throw new Error('Missing option "project" for secret manager solution');
        }
        return true;
    }

    getProjectId() {
        return this.providerOptions.project || this.options.project;
    }

    async getInstance(options: any = {}) {
        if (_.intersection(_.keys(options), _.keys(keyFields)).length > 0) {
            const instance = await this.createInstance(options);
            return instance;
        }
        return this.instance;
    }

    async createInstance(options: any = {}) {
        const config = await providerConfig(this.mergeProviderOptions(options, keyFields));
        return new SecretManagerServiceClient({
            ...config,
            projectId: this.getProjectId(),
        });
    }

    formatPath(path) {
        const replace = path.replace(/(\/|\.)/g, '_');
        return replace;
    }

    buildPath(_path) {
        const format = this.formatPath(_path);
        const path = `projects/${this.providerOptions.project}/secrets/${format}/versions/latest`;
        return path;
    }

    async _getSecretValue(path: string) {
        const name = this.buildPath(path);
        const secrets = await this.getInstance();

        const [version] = await secrets.accessSecretVersion({
            name,
        });
        const payload = version.payload.data.toString();
        return payload;
    }
}
