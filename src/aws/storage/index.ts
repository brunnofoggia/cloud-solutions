import _debug from 'debug';
const debug = _debug('solutions:storage:aws');

import { omit, intersection, keys, map, defaultsDeep, chain } from 'lodash';
import { Interface as ReadLineInterface, createInterface } from 'readline';
import stream from 'stream';
import { Readable } from 'stream';

import { StorageOutputEnum } from '../../common/types/storageOutput.enum';
import { FileInfoInterface, ReadStreamOptions, StorageInterface } from '../../common/interfaces/storage.interface';
import { Storage as AStorage } from '../../common/abstract/storage';
import { keyFields, libraries, providerConfig } from '../index';
import { WriteStream } from './writeStream';
import { copyFileOptionsDefault, CopyFileOptionsInterface } from './interface';
import { streamToString } from '../../common/utils/streamToString';

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
            return instance;
        }
        return this.instance;
    }

    async createInstance(options: any = {}) {
        const S3Client = this.getLibrary('S3Client');
        const _options = this.mergeProviderOptions(options, keyFields);
        const config = await providerConfig(_options);

        return new S3Client(config);
    }

    async readBinary(path, options: any = {}) {
        const stream = (await this.readStream(path, options)) as Readable;
        const data = await streamToString(stream, options.charset || 'binary');
        return data;
    }

    async readContent(path, options: any = {}) {
        !options.charset && (options.charset = 'utf-8');
        return this.readBinary(path, options);
    }

    async readStream(path, options: Partial<ReadStreamOptions> = {}): Promise<ReadLineInterface | NodeJS.ReadableStream> {
        this.isInitialized();
        const GetObjectCommand = this.getLibrary('S3GetObjectCommand');
        const storage = await this.getInstance(options);

        const command = new GetObjectCommand({
            Bucket: this.getOptions().Bucket,
            Key: path,
            ...this.filterOptions(options, keyFields),
        });

        const response = await storage.send(command);
        const rawStream = response?.Body;

        if (!rawStream) {
            throw new Error('Arquivo não encontrado ou vazio');
        }
        if (options.getRawStream) return rawStream;

        const rl = createInterface({
            input: rawStream,
            crlfDelay: Infinity,
        });

        return rl;
    }

    async _sendContent(filePath, content, options: any = {}) {
        this.isInitialized();
        const s3Client = await this.getInstance(options);
        const PutObjectCommand = this.getLibrary('S3PutObjectCommand');

        const uploadParams = {
            ...this.mergeStorageOptions(options, keyFields),
            Key: filePath,
            // buffer used to send binary content correctly
            Body: typeof content === 'string' ? Buffer.from(content) : content,
        };

        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);
        debug(`File sent to ${filePath}`);
    }

    async sendStream(filePath, options: any = {}) {
        this.isInitialized();
        const s3Client = await this.getInstance(options);
        const Upload = this.getLibrary('S3Upload');

        const _stream = new stream.PassThrough();
        // Configura as opções do upload
        const uploadParams = {
            ...this.mergeStorageOptions(options, keyFields),
            Key: filePath,
            Body: _stream,
        };

        const upload = new Upload({
            client: s3Client,
            params: uploadParams,
            queueSize: this.options.params.streamQueueSize, // optional concurrency configuration
            partSize: this.options.params.streamPartSize, // optional size of each part
            leavePartsOnError: true, // optional manually handle dropped parts
            ...(options.params || {}),
        });

        return new WriteStream(_stream, { filePath, upload });
    }

    async deleteFile(filePath, options: any = {}) {
        this.isInitialized();
        const s3Client = await this.getInstance(options);
        const DeleteObjectCommand = this.getLibrary('S3DeleteObjectCommand');

        const deleteParams = {
            ...this.mergeStorageOptions(options, keyFields),
            Key: filePath,
        };
        const command = new DeleteObjectCommand(deleteParams);
        await s3Client.send(command);
        debug(`Delete file ${filePath}`);

        return StorageOutputEnum.Success;
    }

    async deleteDirectory(directoryPath, options: any = {}) {
        this.isInitialized();
        const s3Client = await this.getInstance(options);
        const ListObjectsV2Command = this.getLibrary('S3ListObjectsV2Command');
        const DeleteObjectsCommand = this.getLibrary('S3DeleteObjectsCommand');

        try {
            const listParams = {
                Prefix: directoryPath,
                ...this.mergeStorageOptions(options, keyFields),
            };
            const listCommand = new ListObjectsV2Command(listParams);
            const objects = await s3Client.send(listCommand);

            const deleteParams = {
                ...omit(this.getOptions(), 'params'),
                Delete: {
                    Objects: objects.Contents.map((object) => ({ Key: object.Key })),
                    Quiet: true,
                },
            };

            // Delete the objects returned in the directory
            const deleteCommand = new DeleteObjectsCommand(deleteParams);
            await s3Client.send(deleteCommand);

            // If the directory is truncated, we need to delete the rest of the objects
            if (objects.IsTruncated) {
                await this.deleteDirectory(directoryPath);
            } else {
                // Delete the directory itself
                const deleteSelfDirParams = {
                    ...omit(this.getOptions(), 'params'),
                    Key: directoryPath,
                };

                const deleteSelfDirCommand = new DeleteObjectsCommand(deleteSelfDirParams);
                await s3Client.send(deleteSelfDirCommand);
            }
        } catch (error) {
            return StorageOutputEnum.NotFound;
        }

        return StorageOutputEnum.Success;
    }

    async readDirectory(directoryPath = '', _options: any = {}) {
        this.isInitialized();
        const s3Client = await this.getInstance(_options);
        const ListObjectsV2Command = this.getLibrary('S3ListObjectsV2Command');

        const options: any = this.mergeStorageOptions(_options, keyFields);
        directoryPath && (options.Prefix = directoryPath);

        const command = new ListObjectsV2Command(options);
        const objects = await s3Client.send(command);

        const contentList = map(objects?.Contents || [], (item) => item?.Key);
        return this.filterFilesOnly(contentList);
    }

    async _getFileInfo(params = {}, storage): Promise<any> {
        const HeadObjectCommand = this.getLibrary('S3HeadObjectCommand');
        const command = new HeadObjectCommand(params);

        const response = await storage.send(command);
        return response;
    }

    async getFileInfo(path, options: any = {}): Promise<FileInfoInterface> {
        this.isInitialized();
        const storage = await this.getInstance(options);

        const params = {
            ...this.mergeStorageOptions(options, keyFields),
            Key: path,
        };

        const data = await this._getFileInfo(params, storage);

        return {
            contentLength: data.ContentLength as number,
            etag: data.ETag.replace(/"/g, ''),
        };
    }

    async copyFile(pathFrom, pathTo, options: Partial<CopyFileOptionsInterface> = {}): Promise<void> {
        this.isInitialized();
        const _options: Partial<CopyFileOptionsInterface> = defaultsDeep({}, options, copyFileOptionsDefault);
        const s3Client = await this.getInstance(_options);
        const CopyObjectCommand = this.getLibrary('S3CopyObjectCommand');

        const sourceStorage = (_options.storageFrom || this) as S3;
        const destinationStorage = (_options.storageTo || this) as S3;
        const sourceBucket = sourceStorage.getOptions().Bucket;
        const destinationBucket = destinationStorage.getOptions().Bucket;

        if (!(destinationStorage instanceof S3) || !(sourceStorage instanceof S3)) {
            throw new Error('Both storages must be the instance of S3');
        }

        const copyParams = {
            Bucket: destinationBucket,
            CopySource: `${sourceBucket}/${pathFrom}`,
            Key: pathTo,
        };

        if (options.clear) await destinationStorage.deleteFile(pathTo);
        const command = new CopyObjectCommand(copyParams);
        await s3Client.send(command);
        debug(`File copied from "${sourceBucket}/${pathFrom}" to "${destinationBucket}/${pathTo}"`);

        if (_options.checkSize) {
            const isEqualSize = await destinationStorage.compareSize(pathFrom, pathTo, { storageB: _options.storageTo });
            if (!isEqualSize) throw new Error(`The file "${pathFrom}" was not copied correctly to "${pathTo}"`);
        }

        if (_options.move) await sourceStorage.deleteFile(pathFrom);
    }
}
