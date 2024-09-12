import _debug from 'debug';
const debug = _debug('solutions:storage:fs');

import path from 'path';
import { Interface as ReadLineInterface, createInterface } from 'readline';
import fsp from 'fs/promises';
import { createReadStream, existsSync, lstatSync, mkdirSync, createWriteStream } from 'fs';

import { StorageOutputEnum } from '../../common/types/storageOutput.enum';
import { FileInfoInterface, ReadStreamOptions, StorageInterface } from '../../common/interfaces/storage.interface';
import { Storage } from '../../common/abstract/storage';
import { WriteStream } from './writeStream';

export class Fs extends Storage implements StorageInterface {
    protected defaultOptions: any = {
        basePath: path.join(process.cwd(), 'tmp'),
        baseDir: 'tmp',
    };

    setOptions(options: any = {}) {
        super.setOptions(options);
        if (this.options.Bucket) {
            this.options.baseDir = this.options.baseDir ? path.join(this.options.baseDir, this.options.Bucket) : this.options.Bucket;
            this.options.basePath = this.options.basePath ? path.join(this.options.basePath, this.options.Bucket) : this.options.Bucket;
        }
    }

    buildPath(path_, options: any = {}) {
        const basePath = this.getBasePath(options);

        if (path_.startsWith(basePath)) return path_;
        return path.join(basePath, path_);
    }

    getBasePath(options: any = {}) {
        return options.basePath || this.options.basePath;
    }

    checkOptions() {
        if (!this.options.Bucket) {
            throw new Error('Missing option "Bucket" for storage solution');
        }
        return true;
    }

    async readContent(filePath, options: any = {}) {
        this.isInitialized();
        const _path = this.buildPath(filePath, options);
        return await fsp.readFile(_path, options.charset || 'utf8');
    }

    async readStream(filePath, options: Partial<ReadStreamOptions> = {}): Promise<ReadLineInterface | NodeJS.ReadableStream> {
        this.isInitialized();
        const _path = this.buildPath(filePath, options);
        try {
            if (existsSync(_path)) {
                const data = await createReadStream(_path, { start: 0 });
                if (options.getRawStream) return data;

                const rl = await createInterface({
                    input: data,
                    crlfDelay: Infinity,
                });
                return rl;
            } else debug('file not found', _path);
        } catch (err) {
            debug('fail on creating read stream', err);
        }
    }

    async createDirIfNotExists(path, options: any = {}) {
        const directoryPath = this.buildPath(path);
        if (!existsSync(directoryPath)) {
            mkdirSync(directoryPath, { recursive: true });
        }
    }

    async createDirForFileIfNotExists(path_, options: any = {}) {
        let directoryPath = this.buildPath(path_, options);

        const splitDirs = directoryPath.split('/');
        // remove filename
        splitDirs.pop();
        directoryPath = splitDirs.join('/');

        return await this.createDirIfNotExists(directoryPath, options);
    }

    async _sendContent(filePath, content, options: any = {}) {
        this.isInitialized();
        let _path;
        try {
            _path = this.buildPath(filePath, options);

            this.createDirForFileIfNotExists(_path);
            await fsp.writeFile(_path, content);
            debug(`File sent to ${filePath}`);
        } catch (error) {
            debug(`Fail sending file ${filePath}: ${error}`);
        }
    }

    async sendContent(path, content, options: any = {}, retry = 3) {
        return await this._sendContent(path, content, options);
    }

    async deleteFile(filePath, options: any = {}) {
        this.isInitialized();
        let _path;
        try {
            _path = this.buildPath(filePath, options);
            await fsp.rm(_path, { force: true });
            debug(`Deleted file ${_path}`);
            return StorageOutputEnum.Success;
        } catch (error) {
            debug(`Warning: Fail deleting file ${_path}: ${error}`);
            return StorageOutputEnum.NotFound;
        }
    }

    async deleteDirectory(directoryPath, options: any = {}) {
        this.isInitialized();
        let _path;
        try {
            _path = this.buildPath(directoryPath, options);
            await fsp.rm(_path, { recursive: true, force: true });
            debug(`Deleted directory ${_path}`);
            return StorageOutputEnum.Success;
        } catch (error) {
            debug(`Warning: Fail deleting directory ${_path}: ${error}`);
            return StorageOutputEnum.NotFound;
        }
    }

    async readDirectory(directoryPath_ = '', options: any = {}): Promise<any> {
        this.isInitialized();
        let finalPath;
        try {
            finalPath = this.buildPath(directoryPath_, options);
            const objects = await fsp.readdir(finalPath);
            const list = [];

            for (const name of objects) {
                const itemFullpath = path.join(finalPath, name);
                const itemPath = [directoryPath_, name].join('/');
                if (!lstatSync(itemFullpath).isDirectory()) {
                    list.push(itemPath);
                    continue;
                }
                list.push(...(await this.readDirectory(itemPath, options)));
            }

            return list;
        } catch (error) {
            if (!options.silent) debug(`Fail reading directory ${finalPath}`, error);
            return [];
        }
    }

    async sendStream(filePath, options: any = {}) {
        this.isInitialized();
        await this.createDirForFileIfNotExists(filePath);

        const _path = this.buildPath(filePath, options);
        // const upload = async (content) => await this._sendContent(filePath, content, params);
        const stream = await createWriteStream(_path);

        return new WriteStream(stream, { filePath: _path });
    }

    async getFileInfo(path_, options: any = {}): Promise<FileInfoInterface> {
        this.isInitialized();
        const fullpath = this.buildPath(path_, options);
        const data = await fsp.stat(fullpath);

        return {
            contentLength: data.size as number,
            etag: data.ino + '', // fake tag
        };
    }
}
