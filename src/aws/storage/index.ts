import _debug from 'debug';
const debug = _debug('solutions:storage:aws');

import { omit, intersection, keys, map } from 'lodash';
import { Interface as ReadLineInterface, createInterface } from 'readline';
import stream from 'stream';

import { StorageOutputEnum } from '../../common/types/storageOutput.enum';
import { ReadStreamOptions, StorageInterface } from '../../common/interfaces/storage.interface';
import { Storage as AStorage } from '../../common/abstract/storage';
import { providerConfig, keyFields, libraries } from '../index';
import { WriteStream } from './writeStream';

export class S3 extends AStorage implements StorageInterface {
    protected libraries = libraries;
    protected instance;

    async initialize(options: any = {}) {
        await super.initialize(options);
        this.checkOptions();
        this.instance = await this.createInstance(options);
    }

    async getInstance(options: any = {}) {
        if (intersection(keys(options), keys(keyFields)).length > 0) {
            const instance = await this.createInstance(options);
            await providerConfig(this.getProviderOptions(keyFields));
            return instance;
        }
        return this.instance;
    }

    async createInstance(options: any = {}) {
        await providerConfig(this.mergeProviderOptions(options, keyFields));
        const AWS = this.getLibrary('AWS');
        return new AWS.S3({});
    }

    async readContent(path, options: any = {}) {
        this.isInitialized();
        const storage = await this.getInstance(options);

        const storageParams = {
            ...this.mergeStorageOptions(options, keyFields),
            Key: path,
        };

        const data = await storage.getObject(storageParams).promise();
        return data?.Body.toString(options.charset || 'utf-8');
    }

    async readStream(path, options: Partial<ReadStreamOptions> = {}): Promise<ReadLineInterface | NodeJS.ReadableStream> {
        this.isInitialized();
        const storage = await this.getInstance(options);

        const storageParams = {
            ...this.mergeStorageOptions(options, keyFields),
            Key: path,
        };

        const data = storage.getObject(storageParams).createReadStream();
        if (options.getRawStream) return data;

        const rl = createInterface({
            input: data,
            crlfDelay: Infinity,
        });

        return rl;
    }

    async _sendContent(filePath, content, options: any = {}) {
        this.isInitialized();
        const storage = await this.getInstance(options);

        // Configura as opções do upload
        const uploadParams = {
            ...this.mergeStorageOptions(options, keyFields),
            Key: filePath,
            Body: typeof content === 'string' ? Buffer.from(content) : content,
        };

        await storage.upload(uploadParams, options.params || {}).promise();
        debug(`File sent to ${filePath}`);
    }

    async sendStream(filePath, options: any = {}) {
        this.isInitialized();
        const storage = await this.getInstance(options);

        const _stream = new stream.PassThrough();
        // Configura as opções do upload
        const uploadParams = {
            ...this.mergeStorageOptions(options, keyFields),
            Key: filePath,
            Body: _stream,
        };

        const upload = storage
            .upload(uploadParams, {
                queueSize: this.options.params.streamQueueSize, // optional concurrency configuration
                partSize: this.options.params.streamPartSize, // optional size of each part
                leavePartsOnError: true, // optional manually handle dropped parts
                ...(options.params || {}),
            })
            .promise();

        return new WriteStream(_stream, { filePath, upload });
    }

    async deleteFile(filePath, options: any = {}) {
        this.isInitialized();
        const storage = await this.getInstance(options);
        await storage
            .deleteObject({
                ...this.mergeStorageOptions(options, keyFields),
                Key: filePath,
            })
            .promise();
        debug(`Delete file ${filePath}`);

        return StorageOutputEnum.Success;
    }

    async deleteDirectory(directoryPath, options: any = {}) {
        this.isInitialized();
        const storage = await this.getInstance(options);

        try {
            const objects = await storage
                .listObjectsV2({
                    Prefix: directoryPath,
                    ...this.mergeStorageOptions(options, keyFields),
                })
                .promise();

            const deleteParams = {
                ...omit(this.getOptions(), 'params'),
                Delete: { Objects: objects.Contents.map(({ Key }) => ({ Key })) },
            };

            await storage.deleteObjects(deleteParams).promise();

            if (objects.IsTruncated) {
                await this.deleteDirectory(directoryPath);
            } else {
                await storage
                    .deleteObject({
                        ...omit(this.getOptions(), 'params'),
                        Key: directoryPath,
                    })
                    .promise();
            }
        } catch (error) {
            return StorageOutputEnum.NotFound;
        }

        return StorageOutputEnum.Success;
    }

    async readDirectory(directoryPath = '', _options: any = {}) {
        this.isInitialized();
        const storage = await this.getInstance(_options);

        const options: any = this.mergeStorageOptions(_options, keyFields);
        directoryPath && (options.Prefix = directoryPath);

        const objects = await storage.listObjectsV2(options).promise();

        return map(objects?.Contents || [], (item) => item?.Key);
    }
}
