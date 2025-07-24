import { ParameterStore } from './secrets/index';
import { S3 } from './storage/index';
import { SQS } from './events/index';
import { SolutionsEnum } from './solutions';
import { Solution } from '../common/abstract/solution';

export const StorageAdapter = S3;
export const SecretsAdapter = ParameterStore;
export const EventsAdapter = SQS;

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
        const { AWS } = await Solution.loadLibraries(libraries);
        const _config = {
            region: options.region,
            accessKeyId: options.user,
            secretAccessKey: options.pass,
        };
        await AWS.config.update(_config);
        AWS.config.region = _config.region;

        return _config;
    } catch (error) {
        throw new Error('Error trying to configure AWS SDK: ' + error.message);
    }
};

export const libraries = {
    AWS: 'aws-sdk',
};

export default { StorageAdapter, SecretsAdapter, EventsAdapter, SolutionsEnum, providerConfig, libraries };
