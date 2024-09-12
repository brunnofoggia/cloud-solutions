import _debug from 'debug';
const debug = _debug('solutions:storage:sftp');

import { bind, defaultsDeep, difference, intersection, pick, remove } from 'lodash';
import path from 'path';
import { Interface as ReadLineInterface, createInterface } from 'readline';

import { StorageOutputEnum } from '../../common/types/storageOutput.enum';
import { FileInfoInterface, ReadStreamOptions, StorageInterface } from '../../common/interfaces/storage.interface';
import { Storage } from '../../common/abstract/storage';
import { Fs } from '../../local/storage';
import { BufferWritable } from '../../common/utils/bufferWritable';
import { WriteStream } from './writeStream';

export class Sftp extends Storage implements StorageInterface {
    protected defaultOptions: any = {
        basePath: '',
        baseDir: '',
        stayConnected: true,
        privateKeyStartsWith: '-----BEGIN RSA PRIVATE KEY-----',
        privateKeyEndsWith: '-----END RSA PRIVATE KEY-----',
    };
    instance: any;

    // #region sftp
    _connectionOptionsList = ['host', 'port', 'username'];
    _authOptionsList = ['password', 'privateKey', 'passphrase'];
    _privateKeyStartsWithTest = '-----';

    protected libraries: any = {
        SftpClient: {
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
        // aliases for username and password
        if (this.providerOptions.user) this.providerOptions.username = this.providerOptions.user;
        if (this.providerOptions.pass) this.providerOptions.password = this.providerOptions.pass;
    }

    buildPath(path_, options: any = {}) {
        return bind(Fs.prototype.buildPath, this)(path_, options);
    }

    getBasePath(options: any = {}) {
        return bind(Fs.prototype.getBasePath, this)(options);
    }

    isStayConnectActive() {
        return !!this.options.stayConnected;
    }

    async createGlobalInstance() {
        this.instance = null;
        if (this.isStayConnectActive()) this.instance = await this.createInstance(this.options);
    }

    async createInstance(options_: any = {}): Promise<any> {
        const { SftpClient } = this.libraryImport;
        const connectOptions = this.getConnectionOptions(options_);

        this.filterAuthMethod(connectOptions);
        await this.prepareAuthMethod(connectOptions);

        const sftp = new SftpClient();
        await sftp.connect({ ...connectOptions });

        // to avoid problem mentioned at https://github.com/theophilusx/ssh2-sftp-client?tab=readme-ov-file#dont-re-use-sftpclient-objects
        sftp.connect = (f) => f;

        return sftp;
    }

    async getInstance(options: any = {}) {
        return options.instance || (this.isStayConnectActive() ? this.instance : await this.createInstance(options));
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

    async setPrivateKey(privateKey: string) {
        let _privateKey = privateKey;
        if (!_privateKey.startsWith(this._privateKeyStartsWithTest)) {
            _privateKey = [this.options.privateKeyStartsWith, _privateKey, this.options.privateKeyEndsWith].join('\n');
        }

        return Buffer.from(_privateKey);
    }

    getConnectionOptions(options: any = {}) {
        if (options.user) options.username = options.user;
        if (options.pass) options.password = options.pass;
        const _options = defaultsDeep({}, options, this.options, this.providerOptions);
        const connectOptions = pick(_options, ...this._connectionOptionsList, ...this._authOptionsList);
        return connectOptions;
    }

    async closeInstance(instance = null): Promise<any> {
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
        if (this.isStayConnectActive()) {
            await this.closeInstance();
            await this.createGlobalInstance();
        }
    }

    async closeInstanceIfNotGlobal(instance, options: any = {}) {
        // does not close instance when it was opened by other method
        if (!options.instance) {
            if (!this.isStayConnectActive()) {
                await this._closeInstance(instance);
            }
        }
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

        await this.closeInstanceIfNotGlobal(instance, options);
        const content = memoryStream.getData(options.encode);

        return content;
    }

    async readStream(filePath, options: Partial<ReadStreamOptions> = {}): Promise<ReadLineInterface | NodeJS.ReadableStream> {
        this.isInitialized();
        const instance = await this.getInstance(options);
        try {
            const _path = this.buildPath(filePath, options);
            const exists = await this._checkPathExists(_path, { instance });
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
        await this.closeInstanceIfNotGlobal(instance, options);
    }

    async createDirIfNotExists(directoryPath, options: any = {}) {
        this.isInitialized();
        const instance = await this.getInstance(options);
        try {
            const { exists } = await this._checkPathExists(directoryPath, { instance });
            if (!exists) {
                await instance.mkdir(directoryPath, true);
            }
        } catch (error) {
            console.error('>>>> error createDirIfNotExists', error);
        }
        await this.closeInstanceIfNotGlobal(instance, options);
    }

    async createDirForFileIfNotExists(path_, options: any = {}) {
        return bind(Fs.prototype.createDirForFileIfNotExists, this)(path_, options);
    }

    async sendContent(filePath, content, options: any = {}) {
        this.isInitialized();
        const instance = await this.getInstance(options);
        let _path;
        try {
            const _content = typeof content === 'string' ? Buffer.from(content, options.encode || 'utf8') : content;
            _path = this.buildPath(filePath, options);

            await this.createDirForFileIfNotExists(_path, { instance });
            await instance.put(_content, _path, options);
            debug(`File sent to ${filePath}`);
        } catch (error) {
            debug(`Fail sending file ${_path || filePath}: ${error}`);
            throw error;
        }
        await this.closeInstanceIfNotGlobal(instance, options);
    }

    async deleteFile(filePath, options: any = {}) {
        this.isInitialized();
        const instance = await this.getInstance(options);
        let _path, result;
        try {
            _path = this.buildPath(filePath, options);
            await instance.delete(_path);
            debug(`Deleted file ${_path}`);
            result = StorageOutputEnum.Success;
        } catch (error) {
            debug(`Warning: Fail deleting file ${_path || filePath}: ${error}`);
            result = StorageOutputEnum.NotFound;
        }
        await this.closeInstanceIfNotGlobal(instance, options);
        return result;
    }

    async _deleteDirectory(directoryPath, options: any = {}) {
        const instance = await this.getInstance(options);
        let result;
        try {
            const recursive = 'recursive' in options ? options.recursive : true;
            await instance.rmdir(directoryPath, recursive);
            result = true;
        } catch (error) {
            // code needed for deleting directories and detecting if they were deleted sucessfully
            await this.reconnectGlobalInstance();
            const exists = await this._checkPathExists(directoryPath, { instance });
            if (!exists) {
                result = true;
            } else {
                throw error;
            }
        }
        await this.closeInstanceIfNotGlobal(instance, options);
        return result;
    }

    async deleteDirectory(directoryPath, options: any = {}) {
        this.isInitialized();
        const instance = await this.getInstance(options);
        let _path;
        try {
            _path = this.buildPath(directoryPath, options);
            const exists = await this.checkPathExists(_path, { instance });
            if (exists) {
                await this._deleteDirectory(_path, { ...options, instance });
                debug(`Deleted directory ${_path}`);
                return StorageOutputEnum.Success;
            } else {
                debug(`Warning: Directory not found ${_path || directoryPath}`);
            }
        } catch (error) {
            return StorageOutputEnum.NotFound;
        }
        await this.closeInstanceIfNotGlobal(instance, options);
    }

    async readDirectory(directoryPath = '', options: any = {}): Promise<any> {
        this.isInitialized();
        const instance = await this.getInstance(options);
        let finalPath;
        const list = [];
        try {
            finalPath = this.buildPath(directoryPath, options);
            const objects = await instance.list(finalPath);

            for (const object of objects) {
                const name = object.name;
                const type = object.type;

                const itemPath = path.join(directoryPath, name);
                if (type === '-') {
                    // push file
                    list.push(itemPath);
                    continue;
                }
                list.push(...(await this.readDirectory(itemPath, { ...options, instance })));
            }
        } catch (error) {
            if (!options.silent) debug(`Fail reading directory ${finalPath || directoryPath}`, error);
        }
        await this.closeInstanceIfNotGlobal(instance, options);
        return list;
    }

    async sendStream(filePath, options: any = {}) {
        this.isInitialized();
        const instance = await this.getInstance(options);
        let writeStream;
        try {
            const _path = this.buildPath(filePath, options);

            const streamOptions = defaultsDeep(pick(options, 'flags', 'encoding', 'mode', 'autoClose', 'emitClose', 'start'), {
                autoClose: false,
            });

            await this.createDirForFileIfNotExists(_path, { instance });
            const sftpWriteStream = await instance.createWriteStream(_path, streamOptions);

            writeStream = new WriteStream(
                sftpWriteStream,
                defaultsDeep(
                    {
                        filePath: _path,
                        closeInstance: () => this.closeInstanceIfNotGlobal(instance, options),
                    },
                    options,
                ),
            );
        } catch (error) {
            console.error('>>>> error sendStream', error);
        }
        return writeStream;
    }

    async getFileInfo(path_, options: any = {}): Promise<FileInfoInterface> {
        this.isInitialized();
        const instance = await this.getInstance(options);

        const fullpath = this.buildPath(path_, options);
        const data = await instance.stat(fullpath);

        await this.closeInstanceIfNotGlobal(instance, options);
        return {
            contentLength: data.size as number,
            etag: '',
        };
    }

    async _checkPathExists(path_, options: any = {}) {
        this.isInitialized();
        const instance = options.instance;
        const result = await instance.exists(path_);

        return { exists: result !== false, result };
    }

    async checkPathExists(path_ = '', options: any = {}) {
        const instance = await this.getInstance(options);

        const _path = this.buildPath(path_, options);
        const { exists, result } = await this._checkPathExists(_path, { ...options, instance });
        if (exists && result === 'd') return super.checkPathExists(path_, { ...options, instance });

        await this.closeInstanceIfNotGlobal(instance, options);
        return exists;
    }
}
