import _debug from 'debug';
const debug = _debug('solutions:storage:gcp');

import { defaultsDeep, intersection, keys } from 'lodash';
import { Interface as ReadLineInterface, createInterface } from 'readline';

import { StorageOutputEnum } from '../../common/types/storageOutput.enum';
import { ReadStreamOptions, StorageInterface } from '../../common/interfaces/storage.interface';
import { Storage as AStorage } from '../../common/abstract/storage';
import { providerConfig, keyFields } from '../index';
import { WriteStream } from './writeStream';

let GStorage;
export class Storage extends AStorage implements StorageInterface {
    protected libraries = {
        GStorage: {
            path: '@google-cloud/storage',
            key: 'Storage',
        },
    };
    protected instance;

    async initialize(options: any = {}) {
        await super.initialize(options);
        GStorage = this.getLibrary('GStorage');
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
        const config = await providerConfig(this.mergeProviderOptions(options, keyFields));

        const instance = new GStorage({
            ...config,
        });

        return instance;
    }

    async readContent(path, options: any = {}) {
        this.isInitialized();
        const storage = await this.getInstance(options);
        const Bucket = options.Bucket || this.getOptions().Bucket;
        const [fileContent] = await storage.bucket(Bucket).file(path).download();
        return fileContent?.toString(options.charset || 'utf-8');
    }

    async readStream(path, options: Partial<ReadStreamOptions> = {}): Promise<ReadLineInterface | NodeJS.ReadableStream> {
        this.isInitialized();
        const storage = await this.getInstance(options);
        const Bucket = options.Bucket || this.getOptions().Bucket;

        const data = storage.bucket(Bucket).file(path).createReadStream();
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
        const Bucket = options.Bucket || this.getOptions().Bucket;
        await storage.bucket(Bucket).file(filePath).save(content);
        debug(`File sent to ${filePath}`);
    }

    async sendStream(filePath, options: any = {}) {
        this.isInitialized();
        const storage = await this.getInstance(options);
        const Bucket = options.Bucket || this.getOptions().Bucket;

        const _stream = storage.bucket(Bucket).file(filePath).createWriteStream();

        return new WriteStream(_stream, { filePath, params: defaultsDeep(this.options.params, options.params, { storage, Bucket }) });
    }

    async deleteFile(filePath, options: any = {}) {
        this.isInitialized();
        const storage = await this.getInstance(options);
        const Bucket = options.Bucket || this.getOptions().Bucket;
        const [files] = await storage.bucket(Bucket).getFiles({ prefix: filePath, ...(options.params || {}) });

        await files[0]?.delete();
        debug(`Deleted file ${filePath}`);

        return StorageOutputEnum.Success;
    }

    async deleteDirectory(directoryPath, options: any = {}) {
        this.isInitialized();
        const storage = await this.getInstance(options);

        try {
            const Bucket = options.Bucket || this.getOptions().Bucket;

            const [files] = await storage.bucket(Bucket).getFiles({ prefix: directoryPath, ...(options.params || {}) });
            const deletePromises = [];
            files.forEach((file) => {
                deletePromises.push(file.delete());
            });

            const [subdirectories] = await storage.bucket(Bucket).getFiles({ prefix: directoryPath, delimiter: '/', ...(options.params || {}) });
            subdirectories.forEach((subdirectory) => {
                deletePromises.push(this.deleteDirectory(subdirectory.name));
            });

            await Promise.all(deletePromises);
        } catch (error) {
            return StorageOutputEnum.NotFound;
        }

        return StorageOutputEnum.Success;
    }

    async readDirectory(directoryPath = '', options: any = {}) {
        this.isInitialized();
        const storage = await this.getInstance(options);
        const Bucket = options.Bucket || this.getOptions().Bucket;

        const fileOptions: any = defaultsDeep({ prefix: directoryPath }, options.params || {});
        const [files] = await storage.bucket(Bucket).getFiles(fileOptions);

        const filePaths = [];
        for (const file of files) {
            // remove basepath from filepath
            const filePath = file.name.replace(`gs://${Bucket}/${options.directoryPath || directoryPath}`, '');
            filePaths.push(filePath);
        }

        return filePaths;
    }
}
