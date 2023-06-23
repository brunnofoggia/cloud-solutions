import _debug from 'debug';
const debug = _debug('solutions:storage:aws');

import { omit, intersection, keys, pick, map } from 'lodash';
import AWS from 'aws-sdk';
import { createInterface } from 'readline';
import stream from 'stream';

import { StorageOutputEnum } from '../../common/types/storageOutput.enum';
import { StorageInterface } from '../../common/interfaces/storage.interface';
import { Storage } from '../../common/abstract/storage';
import { providerConfig, keyFields } from '../index';
import { WriteStream } from './writeStream';

export class S3 extends Storage implements StorageInterface {
    protected instance;

    async initialize(options: any = {}) {
        super.initialize(options);
        this.checkOptions();
        this.instance = this.createInstance(options);
    }

    getInstance(options: any = {}) {
        if (intersection(keys(options), keys(keyFields)).length > 0) {
            const instance = this.createInstance(options);
            providerConfig(pick(this.providerOptions, ...keys(keyFields)));
            return instance;
        }
        return this.instance;
    }

    createInstance(options: any = {}) {
        providerConfig(this.mergeProviderOptions(options, keyFields));

        const instance = new AWS.S3({});

        return instance;
    }

    async readContent(path, options: any = {}) {
        this.isInitialized();
        const storage = this.getInstance(options);

        const storageParams = {
            ...omit(this.getOptions(), 'params'),
            ...omit(options, ...keys(keyFields)),
            Key: path,
        };

        const data = await storage.getObject(storageParams).promise();
        return data?.Body.toString(options.charset || 'utf-8');
    }

    async readStream(path, options: any = {}) {
        this.isInitialized();
        const storage = this.getInstance(options);

        const storageParams = {
            ...omit(this.getOptions(), 'params'),
            ...omit(options, ...keys(keyFields)),
            Key: path,
        };

        const data = storage.getObject(storageParams).createReadStream();
        const rl = createInterface({
            input: data,
            crlfDelay: Infinity,
        });

        return rl;
    }

    async _sendContent(filePath, content, params: any = {}) {
        this.isInitialized();
        const storage = this.getInstance(params);

        // Configura as opções do upload
        const uploadParams = {
            ...omit(this.getOptions(), 'params'),
            Key: filePath,
            Body: typeof content === 'string' ? Buffer.from(content) : content,
            ...omit(params, 'options', ...keys(keyFields)),
        };

        await storage.upload(uploadParams, params.options || {}).promise();
        debug(`Os dados foram escritos em ${filePath}`);
    }

    sendStream(filePath, params: any = {}) {
        this.isInitialized();
        const storage = this.getInstance(params);

        const _stream = new stream.PassThrough();
        // Configura as opções do upload
        const uploadParams = {
            ...omit(this.getOptions(), 'params'),
            Key: filePath,
            Body: _stream,
            ...omit(params, 'options', ...keys(keyFields)),
        };

        const upload = storage
            .upload(uploadParams, {
                queueSize: this.options.params.streamQueueSize, // optional concurrency configuration
                partSize: this.options.params.streamPartSize, // optional size of each part
                leavePartsOnError: true, // optional manually handle dropped parts
                ...(params.options || {}),
            })
            .promise();

        return new WriteStream(_stream, { filePath, upload });
    }

    async deleteFile(filePath, options: any = {}) {
        this.isInitialized();
        const storage = this.getInstance(options);
        await storage
            .deleteObject({
                ...omit(this.getOptions(), 'params'),
                Key: filePath,
            })
            .promise();
        debug(`O arquivo ${filePath} foi excluído`);

        return StorageOutputEnum.Success;
    }

    async deleteDirectory(directoryPath, options: any = {}) {
        this.isInitialized();
        const storage = this.getInstance(options);

        const objects = await storage
            .listObjectsV2({
                ...omit(this.getOptions(), 'params'),
                Prefix: directoryPath,
                ...options,
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
        return StorageOutputEnum.Success;
    }

    async readDirectory(directoryPath = '', _options: any = {}) {
        this.isInitialized();
        const storage = this.getInstance(_options);

        const options: any = {
            ...omit(this.getOptions(), 'params'),
            ...omit(_options, ...keys(keyFields)),
        };
        directoryPath && (options.Prefix = directoryPath);

        const objects = await storage.listObjectsV2(options).promise();

        return map(objects?.Contents, (item) => item.Key);
    }

    async checkDirectoryExists(directoryPath = '', options: any = {}) {
        const objects = await this.readDirectory(directoryPath, options);
        return objects?.length > 0;
    }
}
