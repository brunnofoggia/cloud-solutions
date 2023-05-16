import { Secrets } from '../../common/abstract/secrets.js';
import { SecretsInterface } from '../../common/interfaces/secrets.interface.js';
import { getSecretValue, getParamValue } from './functions/paramStore.js';

export class ParameterStore extends Secrets implements SecretsInterface {
    async getSecretValue(path: string) {
        return super.get(path, async (path) => await getSecretValue(path));
    }

    async getValue(path: string) {
        return super.get(path, async (path) => await getParamValue(path));
    }
}