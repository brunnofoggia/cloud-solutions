import { S3 } from './storage/index';
import { ParameterStore } from './secrets/index';
import { SQS } from './events/index';
import { SolutionsEnum } from './solutions';

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
    // check if is a lambda function to ignore credentials
    // if (!options.region || !options.user || !options.pass) {
    if (!options.region) {
        throw new Error('Missing some data for provider. Received: ' + JSON.stringify(options));
    }

    try {
        const _config: any = {
            region: options.region,
        };

        if (options.user) {
            _config.credentials = {
                accessKeyId: options.user,
                secretAccessKey: options.pass,
            };
        }

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
    S3Upload: {
        path: '@aws-sdk/lib-storage',
        key: 'Upload',
    },
    S3GetObjectCommand: {
        path: '@aws-sdk/client-s3',
        key: 'GetObjectCommand',
    },
    S3ListObjectsV2Command: {
        path: '@aws-sdk/client-s3',
        key: 'ListObjectsV2Command',
    },
    S3HeadObjectCommand: {
        path: '@aws-sdk/client-s3',
        key: 'HeadObjectCommand',
    },
    S3CopyObjectCommand: {
        path: '@aws-sdk/client-s3',
        key: 'CopyObjectCommand',
    },
    S3DeleteObjectCommand: {
        path: '@aws-sdk/client-s3',
        key: 'DeleteObjectCommand',
    },
    S3DeleteObjectsCommand: {
        path: '@aws-sdk/client-s3',
        key: 'DeleteObjectsCommand',
    },
    SSMClient: {
        path: '@aws-sdk/client-ssm',
        key: 'SSMClient',
    },
    SSMGetParameterCommand: {
        path: '@aws-sdk/client-ssm',
        key: 'GetParameterCommand',
    },
    SQSClient: {
        path: '@aws-sdk/client-sqs',
        key: 'SQSClient',
    },
    SQSSendMessageCommand: {
        path: '@aws-sdk/client-sqs',
        key: 'SendMessageCommand',
    },
    SQSGetQueueUrlCommand: {
        path: '@aws-sdk/client-sqs',
        key: 'GetQueueUrlCommand',
    },
    SQSCreateQueueCommand: {
        path: '@aws-sdk/client-sqs',
        key: 'CreateQueueCommand',
    },
    SQSDeleteQueueCommand: {
        path: '@aws-sdk/client-sqs',
        key: 'DeleteQueueCommand',
    },
    SQSDeleteMessageCommand: {
        path: '@aws-sdk/client-sqs',
        key: 'DeleteMessageCommand',
    },
    SQSChangeMessageVisibilityCommand: {
        path: '@aws-sdk/client-sqs',
        key: 'ChangeMessageVisibilityCommand',
    },
    SQSReceiveMessageCommand: {
        path: '@aws-sdk/client-sqs',
        key: 'ReceiveMessageCommand',
    },
};

export default {
    StorageAdapter,
    SecretsAdapter,
    EventsAdapter,
    SolutionsEnum,
    providerConfig,
    libraries,
};
