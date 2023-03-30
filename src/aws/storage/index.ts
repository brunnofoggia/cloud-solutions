import AWS from 'aws-sdk';
import { createInterface } from 'readline';

import { StorageOutputEnum } from '../../common/types/storageOutput.enum.js';
import { StorageInterface } from '../../common/interfaces/storage.interface.js';
import { Storage } from '../../common/abstract/storage.js';

export class S3 extends Storage implements StorageInterface {
    protected options: any = {};

    async readContent(path, options: any = {}) {
        const s3 = new AWS.S3();

        const s3Params = {
            ...this.getOptions(),
            ...options,
            Key: path,
        };

        const data = await s3.getObject(s3Params).promise();
        return data;

    }

    async readStream(path, options: any = {}) {
        const s3 = new AWS.S3();

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
        const s3 = new AWS.S3();

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

    async deleteDirectory(directoryName, options: any = {}) {
        const s3 = new AWS.S3();

        const objects = await s3.listObjectsV2({
            ...this.getOptions(),
            ...options,
            Prefix: directoryName
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
            await this.deleteDirectory(directoryName);
        } else {
            await s3.deleteObject({
                ...this.getOptions(),
                Key: directoryName
            }).promise();
        }
        return StorageOutputEnum.Success;
    }
}