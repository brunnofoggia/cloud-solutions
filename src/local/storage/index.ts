import path from 'path';
import { createInterface } from 'readline';
import fs from 'fs/promises';
import { createReadStream, existsSync, mkdirSync } from 'fs';

import _debug from 'debug';

import { StorageOutputEnum } from '../../common/types/storageOutput.enum.js';
import { StorageInterface } from '../../common/interfaces/storage.interface.js';
import { Storage } from '../../common/abstract/storage.js';

const debug = _debug('app:solutions:storage');

export class Fs extends Storage implements StorageInterface {
    protected defaultOptions: any = {
        basePath: path.join(process.cwd(), 'tmp'),
    };

    async readContent(filePath, options: any = {}) {
        const _path = path.join(options.basePath || this.options.basePath, filePath);
        return await fs.readFile(_path, 'utf8');
    }

    async readStream(filePath, options: any = {}) {
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
        try {
            const _path = path.join(options.basePath || this.options.basePath, filePath);

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
        const _path = path.join(options.basePath || this.options.basePath, directoryPath);
        try {
            await fs.rm(_path, { recursive: true, force: true });
            debug(`O diretório ${_path} foi excluído com sucesso!`);
        } catch (error) {
            debug(`Erro ao excluir o diretório ${_path}: ${error}`);
            return StorageOutputEnum.DirectoryNotFound;
        }

        return StorageOutputEnum.Success;
    }

    async readDirectory(directoryPath, options: any = {}) {
        const _path = path.join(options.basePath || this.options.basePath, directoryPath);
        try {
            const objects = await fs.readdir(_path);
            return objects;
        } catch (error) {
            debug(`Erro ao ler o diretório ${_path}`, error);
            return null;
        }
    }


}