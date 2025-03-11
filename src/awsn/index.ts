import { S3 } from './storage/index';
// import { ParameterStore } from './secrets/index';
// import { SQS } from './events/index';
import { SolutionsEnum } from './solutions';
import { Solution } from '../common/abstract/solution';

export const StorageAdapter = S3;
// export const SecretsAdapter = ParameterStore;
// export const EventsAdapter = SQS;

// export const keyFields = ['accessKeyId', 'secretAccessKey', 'region'];
export const keyFields = { user: 'accessKeyId', pass: 'secretAccessKey', region: 'region' };

/*
{
    region: options.region,
    accessKeyId: options.accessKeyId,
    secretAccessKey: options.secretAccessKey,
}
 */

export const providerConfig = async (options: any = {}) => {
    if (!options.region || !options.user || !options.pass) {
        throw new Error('Missing some data into cloud credentials. Received: ' + JSON.stringify(options));
    }

    try {
        const _config = {
            region: options.region,
            accessKeyId: options.user,
            secretAccessKey: options.pass,
        };

        return _config;
    } catch (error) {
        throw new Error('Error trying to configure AWS SDK: ' + error.message);
    }
};

export const libraries = {
    S3Client: {
        path: '@aws-sdk/client-s3',
        key: 'S3Client',
    },
    S3PutObjectCommand: {
        path: '@aws-sdk/client-s3',
        key: 'PutObjectCommand',
    },
};

export default {
    StorageAdapter,
    // SecretsAdapter, EventsAdapter,
    SolutionsEnum,
    providerConfig,
    libraries,
};
