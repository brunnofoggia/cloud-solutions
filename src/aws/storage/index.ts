import _ from 'lodash';
import AWS from 'aws-sdk';
import { createInterface } from 'readline';

import { StorageOutputEnum } from '../../common/types/storageOutput.enum.js';
import { StorageInterface } from '../../common/interfaces/storage.interface.js';
import { Storage } from '../../common/abstract/storage.js';
import { providerConfig, keyFields } from '../index.js';

export class S3 extends Storage implements StorageInterface {
    protected instance;

    async initialize(options: any = {}) {
        super.initialize(options);
        this.instance = this.createInstance(options);
    }

    getInstance(options: any = {}) {
        if (_.intersection(_.keys(options), keyFields).length > 0) {
            const instance = this.createInstance(options);
            providerConfig(_.pick(this.providerOptions, ...keyFields));
            return instance;
        }
        return this.instance;
    }

    createInstance(options: any = {}) {
        providerConfig(_.defaults(
            _.pick(options, ...keyFields),
            _.pick(this.providerOptions, ...keyFields),
        ));

        const instance = new AWS.S3({});

        return instance;
    }

    async readContent(path, options: any = {}) {
        const s3 = this.getInstance(options);

        const s3Params = {
            ...this.getOptions(),
            ...options,
            Key: path,
        };

        const data = await s3.getObject(s3Params).promise();
        return data?.Body.toString(options.charset || 'utf-8');

    }

    async readStream(path, options: any = {}) {
        const s3 = this.getInstance(options);

        const s3Params = {
            ...this.getOptions(),
            ..._.omit(options, ...keyFields),
            Key: path,
        };

        const data = s3.getObject(s3Params).createReadStream();
        const rl = createInterface({
            input: data,
            crlfDelay: Infinity
        });

        return rl;
    }

    async _sendContent(path, content, params: any = {}) {
        const s3 = this.getInstance(params);

        // Configura as opções do upload
        const uploadParams = {
            ...this.getOptions(),
            Key: path,
            Body: typeof content === 'string' ? Buffer.from(content) : content,
            ACL: 'private',
            ..._.omit(params, 'options', ...keyFields),
        };

        await s3.upload(uploadParams, params.options || {}).promise();
    }

    async sendContent(path, content, params: any = {}, retry = 3) {
        try {
            await this._sendContent(path, content, params);
        } catch (err) {
            if (retry) {
                return await this.sendContent(path, content, params, retry - 1);
            }
            throw err;
        }
    }

    async deleteDirectory(directoryPath, options: any = {}) {
        const s3 = this.getInstance(options);

        const objects = await s3.listObjectsV2({
            ...this.getOptions(),
            Prefix: directoryPath,
            ...options,
        }).promise();

        if (objects.Contents.length === 0) {
            return StorageOutputEnum.DirectoryNotFound;
        }

        const deleteParams = {
            ...this.getOptions(),
            Delete: { Objects: objects.Contents.map(({ Key }) => ({ Key })) },
        };

        await s3.deleteObjects(deleteParams).promise();

        if (objects.IsTruncated) {
            await this.deleteDirectory(directoryPath);
        } else {
            await s3.deleteObject({
                ...this.getOptions(),
                Key: directoryPath,
            }).promise();
        }
        return StorageOutputEnum.Success;
    }

    async readDirectory(directoryPath, options: any = {}) {
        const s3 = this.getInstance(options);
        const objects = await s3.listObjectsV2({
            ...this.getOptions(),
            Prefix: directoryPath,
            ...options,
        }).promise();

        return objects?.Contents;
    }
}