import { Secrets } from '../../common/abstract/secrets';
import { SecretsInterface } from '../../common/interfaces/secrets.interface';

export class Env extends Secrets implements SecretsInterface {
    formatPath(path) {
        return path.replace(/(\/|\.)/g, '_');
    }

    async getSecretValue(path: string) {
        path = this.formatPath(path);
        return process.env[path];
    }

    async getValue(path: string) {
        path = this.formatPath(path);
        return process.env[path];
    }
}