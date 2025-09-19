import { Storage } from './storage/index';
import { SecretManager } from './secrets/index';
// import { XXX } from './events/index';
import { SolutionsEnum } from './solutions.interface';
import { SolutionEnum } from '../common/types/solution.enum';

export const StorageAdapter = Storage;
export const SecretsAdapter = SecretManager;
// export const EventsAdapter = XXX;

export const keyFields = { user: 'client_email', pass: 'private_key', region: 'region' };

export const providerConfig = async (options: any = {}) => {
    return {
        credentials: {
            client_email: options.user,
            private_key: options.pass,
        },
    };
};

const Adapters: any = {};
Adapters[SolutionEnum.CLOUD_PROVIDER] = providerConfig;
Adapters[SolutionEnum.SECRETS] = SecretsAdapter;
Adapters[SolutionEnum.STORAGE] = StorageAdapter;
// Adapters[SolutionEnum.EVENTS] = EventsAdapter;

export { SolutionsEnum, Adapters };
export default {
    StorageAdapter,
    SecretsAdapter,
    // EventsAdapter,
    SolutionsEnum,
    providerConfig,
};
