import AWS from 'aws-sdk';
import { createInterface } from 'readline';

import { StorageOutputEnum } from '../../common/types/storageOutput.enum.js';
import { StorageInterface } from '../../common/interfaces/storage.interface.js';
import { Storage } from '../../common/abstract/storage.js';
import _ from 'lodash';

export class S3 extends Storage implements StorageInterface {
    protected instance;

    getInstance() {
        if (!this.instance) {
            this.instance = new AWS.S3({
                ..._.pick(this.options, 'accessKeyId', 'secretAccessKey', 'region')
            });
        }
        return this.instance;
    }

    async readContent(path, options: any = {}) {
        const s3 = this.getInstance();

        const s3Params = {
            ...this.getOptions(),
            ...options,
            Key: path,
        };

        const data = await s3.getObject(s3Params).promise();
        return data;

    }

    async readStream(path, options: any = {}) {
        const s3 = this.getInstance();

        const s3Params = {
            ...this.getOptions(),
            ...options,
            Key: path,
        };

        const data = s3.getObject(s3Params).createReadStream();
        const rl = createInterface({
            input: data,
            crlfDelay: Infinity
        });

        return rl;
    }

    async _sendContent(path, content, options: any = {}) {
        const s3 = this.getInstance();

        // Configura as opções do upload
        const uploadOptions = {
            ...this.getOptions(),
            ...options,
            Key: path,
            Body: typeof content === 'string' ? Buffer.from(content) : content,
            ACL: 'private'
        };

        await s3.upload(uploadOptions).promise();
    }

    async sendContent(path, content, options: any = {}, retry = 3) {
        try {
            await this._sendContent(path, content, options);
        } catch (err) {
            if (retry) {
                return await this.sendContent(path, content, options, retry - 1);
            }
            throw err;
        }
    }

    async deleteDirectory(directoryPath, options: any = {}) {
        const s3 = this.getInstance();

        const objects = await s3.listObjectsV2({
            ...this.getOptions(),
            ...options,
            Prefix: directoryPath
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
                Key: directoryPath
            }).promise();
        }
        return StorageOutputEnum.Success;
    }

    async readDirectory(directoryPath, options: any = {}) {
        const s3 = this.getInstance();
        const objects = await s3.listObjectsV2({
            ...this.getOptions(),
            ...options,
            Prefix: directoryPath
        }).promise();

        return objects?.Contents;
    }
}