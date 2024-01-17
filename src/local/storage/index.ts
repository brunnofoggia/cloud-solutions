import _debug from 'debug';
const debug = _debug('solutions:storage:fs');

import path from 'path';
import { createInterface } from 'readline';
import fs from 'fs/promises';
import { createReadStream, existsSync, lstatSync, mkdirSync, createWriteStream } from 'fs';
import { each, map } from 'lodash';

import { StorageOutputEnum } from '../../common/types/storageOutput.enum';
import { StorageInterface } from '../../common/interfaces/storage.interface';
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
            this.options.baseDir += '/' + this.options.Bucket;
            this.options.basePath += '/' + this.options.Bucket;
        }
    }

    checkOptions() {
        if (!this.options.Bucket) {
            throw new Error('Missing option "Bucket" for storage solution');
        }
        return true;
    }

    async readContent(filePath, options: any = {}) {
        this.isInitialized();
        const _path = path.join(options.basePath || this.options.basePath, filePath);
        return await fs.readFile(_path, 'utf8');
    }

    async readStream(filePath, options: any = {}) {
        this.isInitialized();
        const _path = path.join(options.basePath || this.options.basePath, filePath);
        try {
            if (existsSync(_path)) {
                const data = await createReadStream(_path);
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

    createDirIfNotExists(_path) {
        let directoryPath = !_path.startsWith(this.options.basePath) ? path.join(this.options.basePath, _path) : _path;

        const splitDirs = directoryPath.split('/');
        splitDirs.pop();
        directoryPath = splitDirs.join('/');

        if (!existsSync(directoryPath)) {
            mkdirSync(directoryPath, { recursive: true });
        }
    }

    async _sendContent(filePath, content, options: any = {}) {
        this.isInitialized();
        let _path;
        try {
            _path = path.join(options.basePath || this.options.basePath, filePath);

            this.createDirIfNotExists(_path);
            await fs.writeFile(_path, content);
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
            _path = path.join(options.basePath || this.options.basePath, filePath);
            await fs.rm(_path, { force: true });
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
            _path = path.join(options.basePath || this.options.basePath, directoryPath);
            await fs.rm(_path, { recursive: true, force: true });
            debug(`Deleted directory ${_path}`);
            return StorageOutputEnum.Success;
        } catch (error) {
            debug(`Warning: Fail deleting directory ${_path}: ${error}`);
            return StorageOutputEnum.NotFound;
        }
    }

    async readDirectory(directoryPath = '', options: any = {}): Promise<any> {
        this.isInitialized();
        let _path;
        try {
            _path = path.join(options.basePath || this.options.basePath, directoryPath);
            const objects = await fs.readdir(_path);
            const list = [];

            for (const name of objects) {
                const itemFullpath = path.join(options.basePath || this.options.basePath, directoryPath, name);
                const itemPath = [directoryPath, name].join('/');
                if (!lstatSync(itemFullpath).isDirectory()) {
                    list.push(itemPath);
                    continue;
                }
                list.push(...(await this.readDirectory(itemPath, options)));
            }

            return list;
        } catch (error) {
            if (!options.silent) debug(`Fail reading directory ${_path}`, error);
            return [];
        }
    }

    sendStream(filePath, options: any = {}) {
        this.isInitialized();
        this.createDirIfNotExists(filePath);

        const _path = path.join(options.basePath || this.options.basePath, filePath);
        // const upload = async (content) => await this._sendContent(filePath, content, params);
        const upload = createWriteStream(_path);

        return new WriteStream(upload);
    }
}
