// import _debug from 'debug';
// const debug = _debug('solutions:storage:sftp');
const debug = console.log;

import { bind, defaultsDeep, difference, intersection, pick, remove } from 'lodash';
import path from 'path';
import { Interface as ReadLineInterface, createInterface } from 'readline';

import fsp from 'fs/promises';
import { createReadStream, existsSync, lstatSync } from 'fs';

import { StorageOutputEnum } from '../../common/types/storageOutput.enum';
import { ReadStreamOptions, StorageInterface } from '../../common/interfaces/storage.interface';
import { Storage } from '../../common/abstract/storage';
import { Fs } from '../../local/storage';
import { BufferWritable } from '../../common/utils/bufferWritable';
import { WriteStream } from './writeStream';
import { sleep } from '../../common/utils';
// import { WriteStream } from './writeStream';

// import __sftp from 'ssh2-sftp-client';

export class Sftp extends Storage implements StorageInterface {
    protected defaultOptions: any = {
        basePath: '',
        baseDir: '',
        stayConnected: false,
        privateKeyStartsWith: '-----BEGIN RSA PRIVATE KEY-----',
        privateKeyEndsWith: '-----END RSA PRIVATE KEY-----',
    };
    instance: any;

    // #region sftp
    _connectionOptionsList = ['host', 'port', 'username'];
    _authOptionsList = ['password', 'privateKey', 'passphrase'];
    _privateKeyStartsWithTest = '-----';

    protected libraries: any = {
        Client: {
            path: 'ssh2-sftp-client',
            version: '10',
        },
    };

    async initialize(options: any = {}) {
        await super.initialize(options);
        this.checkOptions();
        await this.createGlobalInstance();
    }

    setOptions(options: any = {}) {
        bind(Fs.prototype.setOptions, this)(options);
        if (this.providerOptions.user) this.providerOptions.username = this.providerOptions.user;
        if (this.providerOptions.pass) this.providerOptions.password = this.providerOptions.pass;
    }

    buildPath(path_, options: any = {}) {
        return bind(Fs.prototype.buildPath, this)(path_, options);
    }

    getBasePath(options: any = {}) {
        return bind(Fs.prototype.getBasePath, this)(options);
    }

    async createGlobalInstance() {
        this.instance = null;
        if (this.options.stayConnected) this.instance = await this.createInstance(this.options);
    }

    async createInstance(options_: any = {}): Promise<any> {
        // return new Promise((resolve, reject) => {
        const { Client } = this.libraryImport;
        const connectOptions = this.getConnectionOptions(options_);

        this.filterAuthMethod(connectOptions);
        await this.prepareAuthMethod(connectOptions);

        console.log('createInstance > connectOptions', connectOptions);
        const sftp = new Client();
        await sftp.connect({ ...connectOptions });
        // to avoid problem mentioned at https://github.com/theophilusx/ssh2-sftp-client?tab=readme-ov-file#dont-re-use-sftpclient-objects
        sftp.connect = (f) => f;

        return sftp;
        // sftp.connect({ ...connectOptions })
        //     .then(() => {
        //         debug('Connected to SFTP');
        //         resolve(sftp);
        //     })
        //     .catch((err) => {
        //         debug('Fail connecting to SFTP', err);
        //         reject(err);
        //     });
        // });
    }

    filterAuthMethod(connectOptions) {
        let removeAuthMethods = [...this._authOptionsList];
        if (connectOptions.password) {
            removeAuthMethods = remove(removeAuthMethods, (item) => item === 'password');
        } else if (connectOptions.privateKey) {
            removeAuthMethods = remove(removeAuthMethods, (item) => item === 'privateKey');
        } else if (connectOptions.passphrase) {
            removeAuthMethods = remove(removeAuthMethods, (item) => item === 'passphrase');
        }
        remove(connectOptions, removeAuthMethods);
        return connectOptions;
    }

    async prepareAuthMethod(connectOptions) {
        if (connectOptions.privateKey && typeof connectOptions.privateKey === 'string') {
            connectOptions.privateKey = await this.setPrivateKey(connectOptions.privateKey);
        }
        return connectOptions;
    }

    async setPrivateKey(privateKey_: string) {
        let privateKey = privateKey_;
        if (!privateKey.startsWith(this._privateKeyStartsWithTest)) {
            privateKey = [this.options.privateKeyStartsWith, privateKey, this.options.privateKeyEndsWith].join('\n');
        }

        return Buffer.from(privateKey);
    }

    async getInstance(options: any = {}) {
        return this.options.stayConnected ? this.instance : options.instance || (await this.createInstance(options));
    }

    getConnectionOptions(options_: any = {}) {
        if (options_.user) options_.username = options_.user;
        if (options_.pass) options_.password = options_.pass;
        const options = defaultsDeep({}, options_, this.options, this.providerOptions);
        const connectOptions = pick(options, ...this._connectionOptionsList, ...this._authOptionsList);
        return connectOptions;
    }

    async closeInstance(instance = null): Promise<any> {
        // if (!this.options.stayConnected || force) {
        //     return await instance.end();
        // }
        let isGlobalInstance = false;
        if (instance === null) {
            instance = this.instance;
            isGlobalInstance = true;
        }
        await this._closeInstance(instance);
        if (isGlobalInstance) this.instance = null;
    }

    async _closeInstance(instance): Promise<any> {
        try {
            if (instance) return await instance.end();
        } catch (error) {
            error;
        }
    }

    async reconnectGlobalInstance() {
        if (this.options.stayConnected) {
            await this.closeInstance();
            await this.createGlobalInstance();
        }
    }

    async closeInstanceIfNotGlobal(instance) {
        if (!this.options.stayConnected) await this._closeInstance(instance);
    }

    checkOptions() {
        const connectOptions = this.getConnectionOptions();

        const diff = difference([...this._connectionOptionsList], Object.keys(connectOptions));
        if (diff.length > 0) {
            throw new Error('Missing options: ' + diff.join(', '));
        }

        const intersect = intersection(this._authOptionsList, Object.keys(connectOptions));
        if (intersect.length < 1) {
            throw new Error('Missing auth option. One of the following is needed: ' + this._authOptionsList.join(', '));
        }

        return true;
    }

    // #endregion

    async readContent(path_, options: any = {}) {
        this.isInitialized();
        const instance = await this.getInstance(options);
        const path = this.buildPath(path_, options);

        const memoryStream = new BufferWritable();
        await instance.get(path, memoryStream);

        await this.closeInstanceIfNotGlobal(instance);
        const content = memoryStream.getData(options.encode);

        return content;
    }

    async readStream(filePath, options: Partial<ReadStreamOptions> = {}): Promise<ReadLineInterface | NodeJS.ReadableStream> {
        this.isInitialized();
        try {
            const instance = await this.getInstance(options);
            const _path = this.buildPath(filePath, options);
            const exists = await this._checkPathExists(_path);
            if (exists) {
                const data = await instance.createReadStream(_path, pick(options, 'encoding', 'start'));
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

    async createDirIfNotExists(path_, options: any = {}) {
        try {
            this.isInitialized();
            const instance = await this.getInstance(options);

            let directoryPath = !path_.startsWith(this.options.basePath) ? this.buildPath(path_, options) : path_;

            const splitDirs = directoryPath.split('/');
            // remove filename
            splitDirs.pop();
            directoryPath = splitDirs.join('/');

            const exists = await this._checkPathExists(directoryPath, { instance });
            if (!exists) {
                await instance.mkdir(directoryPath, true);
                await sleep(1000);
            }

            await this.closeInstanceIfNotGlobal(instance);
        } catch (error) {
            console.error('>>>> error createDirIfNotExists', error);
        }
    }

    async _sendContent(filePath, content, options: any = {}) {
        this.isInitialized();
        let _path;
        const instance = await this.getInstance(options);
        try {
            const _content = typeof content === 'string' ? Buffer.from(content, options.encode || 'utf8') : content;

            _path = this.buildPath(filePath, options);

            await this.createDirIfNotExists(_path, { instance });
            await instance.put(_content, _path, options);
            debug(`File sent to ${filePath}`);
        } catch (error) {
            debug(`Fail sending file ${filePath}: ${error}`);
            throw error;
        }
        await this.closeInstanceIfNotGlobal(instance);
    }

    async sendContent(filePath, content, options: any = {}, retry = 3) {
        return this._sendContent(filePath, content, options);
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
        try {
            this.isInitialized();
            const _path = this.buildPath(filePath, options);
            const instance = await this.getInstance(options);

            const streamOptions = defaultsDeep(pick(options, 'flags', 'encoding', 'mode', 'autoClose', 'emitClose', 'start'), {
                autoClose: false,
            });

            await this.createDirIfNotExists(_path, { instance });
            const sftpWriteStream = await instance.createWriteStream(_path, streamOptions);

            const writeStream = new WriteStream(
                sftpWriteStream,
                defaultsDeep(
                    {
                        filePath: _path,
                        closeInstance: () => this.closeInstanceIfNotGlobal(instance),
                    },
                    options,
                ),
            );

            return writeStream;
        } catch (error) {
            console.error('>>>> error sendStream', error);
        }
    }

    async getFileInfo(path_, options: any = {}) {
        this.isInitialized();
        const fullpath = this.buildPath(path_, options);
        const data = await fsp.stat(fullpath);

        return {
            contentLength: data.size,
            etag: data.ino + '', // fake tag
        };
    }

    async _checkPathExists(path_, options: any = {}) {
        this.isInitialized();
        const instance = await this.getInstance(options);
        const exists = await instance.exists(path_);

        return exists !== false;
    }

    async checkPathExists(path_ = '', options: any = {}) {
        const _path = this.buildPath(path_, options);
        return this._checkPathExists(_path, options);
    }
}
