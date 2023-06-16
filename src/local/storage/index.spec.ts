import { Fs } from './index';
import { mockDirPath, mockSubdirPath, mockFileContent, mockFilePath, mockNullDir } from '@test/mocks/storage.mock';
import fs from 'fs';
import path from 'path';
import { Interface } from 'readline';

describe('Local Storage', () => {
    let storage: Fs;
    const baseDir = path.join(process.cwd(), 'tmp');

    beforeEach(() => {
        const providerOptions = {};
        storage = new Fs(providerOptions);
        storage.initialize();
    });

    describe('to be defined', () => {
        it('storage', async () => {
            expect(storage).toBeDefined();
        });
    });

    describe('method: _sendContent', () => {
        it('should send content to a file', async () => {
            await expect(storage.sendContent(mockFilePath, mockFileContent)).resolves.toBeUndefined();
        });
    });

    describe('method: readContent', () => {
        it('should return the content', async () => {
            const value = await storage.readContent(mockFilePath);
            expect(value).toEqual(mockFileContent);
        });

        it('invalid pathFile should throw an error', async () => {
            await expect(storage.readContent('invalid')).rejects.toThrow();
        });
    });

    describe('method: readStream', () => {
        it('should return the interface', async () => {
            const spyReadStream = jest.spyOn(storage, 'readStream');
            const value = await storage.readStream(mockFilePath);
            expect(spyReadStream).toHaveBeenCalledWith(mockFilePath);
            expect(value).toBeInstanceOf(Interface);
        });
    });

    describe('method: createDirIfNotExists', () => {
        it('should create if not exists', () => {
            const _path = [baseDir, mockSubdirPath].join('/');
            storage.createDirIfNotExists([_path, 'file'].join('/'));
            expect(fs.existsSync(_path)).toBeTruthy();
        });
    });

    describe('method: readDirectory', () => {
        it('should return the content', async () => {
            const value = await storage.readDirectory();
            expect(value).toContain(mockFilePath);
        });

        it('should return null', async () => {
            const value = await storage.readDirectory(mockNullDir);
            expect(value).toBeNull;
        });
    });

    describe('method: checkDirectoryExists', () => {
        it('check if root dir exists', async () => {
            const value = await storage.checkDirectoryExists();
            expect(value).toBeTruthy();
        });

        it('check if some dir exists', async () => {
            const value = await storage.checkDirectoryExists(mockDirPath);
            expect(value).toBeTruthy();
        });

        it('check unexistent dir', async () => {
            const value = await storage.checkDirectoryExists(mockNullDir);
            expect(value).toBeFalsy();
        });
    });

    describe('method: deleteDirectory', () => {
        it('should delete the file', async () => {
            const _path = [baseDir, mockFilePath].join('/');
            await storage.deleteDirectory(mockFilePath);
            expect(fs.existsSync(_path)).toBeFalsy();
        });

        it('should delete the directory', async () => {
            const _path = [baseDir, mockDirPath].join('/');
            await storage.deleteDirectory(mockDirPath);
            expect(fs.existsSync(_path)).toBeFalsy();
        });
    });
});
