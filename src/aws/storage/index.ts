import _ from 'lodash';
import AWS from 'aws-sdk';
import { createInterface } from 'readline';

import { StorageOutputEnum } from '../../common/types/storageOutput.enum.js';
import { StorageInterface } from '../../common/interfaces/storage.interface.js';
import { Storage } from '../../common/abstract/storage.js';
import { providerConfig, keyFields } from '../index.js';
import stream from 'stream';
import { WriteStream } from './writeStream.js';

export class S3 extends Storage implements StorageInterface {
    protected instance;

    async initialize(options: any = {}) {
        super.initialize(options);
        this.checkOptions();
        this.instance = this.createInstance(options);
    }

    getInstance(options: any = {}) {
        if (_.intersection(_.keys(options), _.keys(keyFields)).length > 0) {
            const instance = this.createInstance(options);
            providerConfig(_.pick(this.providerOptions, ..._.keys(keyFields)));
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
            ...this.getOptions(),
            ..._.omit(options, ..._.keys(keyFields)),
            Key: path,
        };

        const data = await storage.getObject(storageParams).promise();
        return data?.Body.toString(options.charset || 'utf-8');

    }

    async readStream(path, options: any = {}) {
        this.isInitialized();
        const storage = this.getInstance(options);

        const storageParams = {
            ...this.getOptions(),
            ..._.omit(options, ..._.keys(keyFields)),
            Key: path,
        };

        const data = storage.getObject(storageParams).createReadStream();
        const rl = createInterface({
            input: data,
            crlfDelay: Infinity
        });

        return rl;
    }

    async _sendContent(path, content, params: any = {}) {
        this.isInitialized();
        const storage = this.getInstance(params);

        // Configura as opções do upload
        const uploadParams = {
            ...this.getOptions(),
            Key: path,
            Body: typeof content === 'string' ? Buffer.from(content) : content,
            ..._.omit(params, 'options', ..._.keys(keyFields)),
        };

        await storage.upload(uploadParams, params.options || {}).promise();
    }

    sendStream(path, params: any = {}) {
        this.isInitialized();
        const storage = this.getInstance(params);

        const _stream = new stream.PassThrough();
        // Configura as opções do upload
        const uploadParams = {
            ...this.getOptions(),
            Key: path,
            Body: _stream,
            ..._.omit(params, 'options', ..._.keys(keyFields)),
        };

        const upload = storage.upload(uploadParams, {
            queueSize: 4, // optional concurrency configuration
            partSize: '5MB', // optional size of each part
            leavePartsOnError: true, // optional manually handle dropped parts
            ...(params.options || {}),

        }).promise();

        return new WriteStream(_stream, { upload });
    }

    async deleteDirectory(directoryPath, options: any = {}) {
        this.isInitialized();
        const storage = this.getInstance(options);

        const objects = await storage.listObjectsV2({
            ...this.getOptions(),
            Prefix: directoryPath,
            ...options,
        }).promise();

        const deleteParams = {
            ...this.getOptions(),
            Delete: { Objects: objects.Contents.map(({ Key }) => ({ Key })) },
        };

        await storage.deleteObjects(deleteParams).promise();

        if (objects.IsTruncated) {
            await this.deleteDirectory(directoryPath);
        } else {
            await storage.deleteObject({
                ...this.getOptions(),
                Key: directoryPath,
            }).promise();
        }
        return StorageOutputEnum.Success;
    }

    async readDirectory(directoryPath, options: any = {}) {
        this.isInitialized();
        const storage = this.getInstance(options);
        const objects = await storage.listObjectsV2({
            ...this.getOptions(),
            Prefix: directoryPath,
            ...options,
        }).promise();

        return _.map(objects?.Contents, (item) => item.Key);
    }

    async checkDirectoryExists(directoryPath, options: any = {}) {
        const objects = await this.readDirectory(directoryPath, options);
        return objects?.length > 0;
    }
}