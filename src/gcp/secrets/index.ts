import _ from 'lodash';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

import { Secrets } from '../../common/abstract/secrets';
import { SecretsInterface } from '../../common/interfaces/secrets.interface';
import { keyFields, providerConfig } from '../index';

export class SecretManager extends Secrets implements SecretsInterface {
    protected instance;

    async initialize(options: any = {}) {
        super.initialize(options);
        this.checkOptions();
        this.instance = this.createInstance(options);
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

    getInstance(options: any = {}) {
        if (_.intersection(_.keys(options), _.keys(keyFields)).length > 0) {
            const instance = this.createInstance(options);
            return instance;
        }
        return this.instance;
    }

    createInstance(options: any = {}) {
        const config = providerConfig(_.defaults(
            _.omitBy(_.pick(options, ..._.keys(keyFields)), (value) => !value),
            _.pick(this.providerOptions, ..._.keys(keyFields)),
        ));

        const instance = new SecretManagerServiceClient({
            ...config,
            projectId: this.getProjectId()
        });

        return instance;
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
        const secrets = this.getInstance();

        const [version] = await secrets.accessSecretVersion({
            name,
        });
        const payload = version.payload.data.toString();
        return payload;
    }

    async getSecretValue(path: string) {
        return super.get(path, async (path) => await this._getSecretValue(path));
    }

    async getValue(path: string) {
        return super.get(path, async (path) => await this._getSecretValue(path));
    }
}