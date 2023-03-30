import aws from 'aws-sdk';

import { ParameterStore } from './secrets/index.js';
import { S3 } from './storage/index.js';
import { SolutionsEnum } from './solutions.js';

export const StorageAdapter = S3;
export const SecretsAdapter = ParameterStore;

export const providerConfig = (options: any = {}) => {
    if (options.region &&
        options.accessKeyId &&
        options.secretAccessKey) {
        const _config = {
            region: options.region,
            accessKeyId: options.accessKeyId,
            secretAccessKey: options.secretAccessKey,
        };
        aws.config.update(_config);
        aws.config.region = _config.region;
    }
};

export default { StorageAdapter, SecretsAdapter, SolutionsEnum, providerConfig };