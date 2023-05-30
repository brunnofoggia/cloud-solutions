import { Storage } from './storage/index.js';
// import { XXX } from './secrets/index.js';
// import { XXX } from './events/index.js';
import { SolutionsEnum } from './solutions.js';

export const StorageAdapter = Storage;
// export const SecretsAdapter = XXX;
// export const EventsAdapter = XXX;

export const keyFields = { user: 'client_email', pass: 'private_key', region: 'region' };

export const providerConfig = (options: any = {}): any => {
    return {
        credentials: {
            client_email: options.user,
            private_key: options.pass,
        }
    };
};

export default {
    StorageAdapter,
    // SecretsAdapter,
    // EventsAdapter,
    SolutionsEnum,
    providerConfig
};