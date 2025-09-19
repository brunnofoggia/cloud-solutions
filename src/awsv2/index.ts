import { AwsV2ParameterStore } from './secrets/index';
import { AwsV2S3 } from './storage/index';
import { AwsV2Sqs } from './events/index';
import { SolutionsEnum } from './solutions.interface';
import { Solution } from '../common/abstract/solution';
import { SolutionEnum } from '../common/types/solution.enum';

export const StorageAdapter = AwsV2S3;
export const SecretsAdapter = AwsV2ParameterStore;
export const EventsAdapter = AwsV2Sqs;

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

const Adapters: any = {};
Adapters[SolutionEnum.CLOUD_PROVIDER] = providerConfig;
Adapters[SolutionEnum.SECRETS] = SecretsAdapter;
Adapters[SolutionEnum.STORAGE] = StorageAdapter;
Adapters[SolutionEnum.EVENTS] = EventsAdapter;

export { SolutionsEnum, Adapters };
export default { StorageAdapter, SecretsAdapter, EventsAdapter, SolutionsEnum, providerConfig, libraries };
