import aws from 'aws-sdk';

import { ParameterStore } from './secrets/index.js';
import { S3 } from './storage/index.js';
import { SQS } from './events/index.js';
import { SolutionsEnum } from './solutions.js';

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

export const providerConfig = (options: any = {}) => {
    if (options.region &&
        options.user &&
        options.pass) {
        const _config = {
            region: options.region,
            accessKeyId: options.user,
            secretAccessKey: options.pass,
        };
        aws.config.update(_config);
        aws.config.region = _config.region;
    }
};

export default { StorageAdapter, SecretsAdapter, EventsAdapter, SolutionsEnum, providerConfig };