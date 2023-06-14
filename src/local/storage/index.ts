import path from 'path';
import { createInterface } from 'readline';
import fs from 'fs/promises';
import { createReadStream, existsSync, mkdirSync } from 'fs';

import _debug from 'debug';

import { StorageOutputEnum } from '../../common/types/storageOutput.enum';
import { StorageInterface } from '../../common/interfaces/storage.interface';
import { Storage } from '../../common/abstract/storage';
import { WriteStream } from './writeStream';

const debug = _debug('solutions:storage:fs');

export class Fs extends Storage implements StorageInterface {
    protected defaultOptions: any = {
        basePath: path.join(process.cwd(), 'tmp'),
    };

    async readContent(filePath, options: any = {}) {
        this.isInitialized();
        const _path = path.join(options.basePath || this.options.basePath, filePath);
        return await fs.readFile(_path, 'utf8');
    }

    async readStream(filePath, options: any = {}) {
        this.isInitialized();
        const _path = path.join(options.basePath || this.options.basePath, filePath);
        const data = createReadStream(_path);
        const rl = createInterface({
            input: data,
            crlfDelay: Infinity
        });

        return rl;
    }

    createDirIfNotExists(_path) {
        const directoryPath = path.dirname(_path);
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
            debug(`Os dados foram escritos em ${filePath} com sucesso!`);
        } catch (error) {
            debug(`Erro ao escrever os dados em ${filePath}: ${error}`);
        }
    }

    async sendContent(path, content, options: any = {}, retry = 3) {
        return await this._sendContent(path, content, options);
    }

    async deleteDirectory(directoryPath, options: any = {}) {
        this.isInitialized();
        let _path;
        try {
            _path = path.join(options.basePath || this.options.basePath, directoryPath);
            await fs.rm(_path, { recursive: true, force: true });
            debug(`O diretório ${_path} foi excluído com sucesso!`);
        } catch (error) {
            debug(`Erro ao excluir o diretório ${_path}: ${error}`);
            return StorageOutputEnum.DirectoryNotFound;
        }

        return StorageOutputEnum.Success;
    }

    async readDirectory(directoryPath = '', options: any = {}) {
        this.isInitialized();
        let _path;
        try {
            _path = path.join(options.basePath || this.options.basePath, directoryPath);
            const objects = await fs.readdir(_path);
            return objects;
        } catch (error) {
            if (!options.silent)
                debug(`Erro ao ler o diretório ${_path}`, error);
            return null;
        }
    }

    async checkDirectoryExists(directoryPath = '', options: any = {}) {
        let objects = null;

        try {
            objects = await this.readDirectory(directoryPath, { options, silent: 1 });
            return objects?.length > 0;
        } catch (error) {
            return 0;
        }
    }

    sendStream(path, params: any = {}) {
        this.isInitialized();
        const upload = async (content) => await this._sendContent(path, content, params);

        return new WriteStream(upload);
    }


}