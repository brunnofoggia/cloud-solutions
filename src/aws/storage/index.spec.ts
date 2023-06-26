import dotenv from 'dotenv';
dotenv.config({ path: 'test/env/aws/.env' });
import { S3 } from '.';
import AWS from 'aws-sdk';
import {
    mockFilePath,
    mockFileContent,
    mockDir,
    mockDirContentList,
    mockSubdir,
    mockFileStreamPath,
    mockFileStreamContent,
} from '@test/mocks/aws/storage.mock';
import { Interface } from 'readline';
import { WriteStream } from './writeStream';

describe('Aws Storage', () => {
    let storage: S3;

    beforeAll(() => {
        const providerOptions = {
            region: process.env.CLOUD_REGION,
            user: process.env.CLOUD_USER,
            pass: process.env.CLOUD_PASS,
        };
        const Bucket = process.env.CLOUD_BUCKET;
        storage = new S3(providerOptions);
        storage.initialize({ Bucket });
    });

    describe('to be defined', () => {
        it('storage', async () => {
            expect(storage).toBeDefined();
        });
    });

    describe('method: checkOptions', () => {
        it('should return true', () => {
            const value = storage.checkOptions();
            expect(value).toBeTruthy();
        });
        it('throw error', () => {
            const instance = new S3({});
            expect(async () => instance.checkOptions()).rejects.toThrow();
        });
    });

    describe('method: getInstance', () => {
        it('value should be instance of AWS.S3', () => {
            const value = storage.getInstance();
            expect(value).toBeInstanceOf(AWS.S3);
        });
    });

    describe('method: createInstance', () => {
        it('value should be instance of AWS.S3', () => {
            const value = storage.createInstance();
            expect(value).toBeInstanceOf(AWS.S3);
        });
    });

    describe('method: sendContent', () => {
        it('upload file', async () => {
            await expect(storage.sendContent(mockFilePath, mockFileContent)).resolves.toBeUndefined();
        });

        it('upload dir/subdir', async () => {
            const _path = [mockDir, mockSubdir].join('/');
            await expect(storage.sendContent(_path, mockFileContent)).resolves.toBeUndefined();
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

    describe('method: sendStream', () => {
        it('value should be instance of WriteStream', async () => {
            const value = storage.sendStream(mockFileStreamPath);
            await value.write(mockFileStreamContent);
            await value.end();
            expect(value).toBeInstanceOf(WriteStream);
        });
    });

    describe('method: readStream', () => {
        it('value should be instance of Interface', async () => {
            const stream = await storage.readStream(mockFileStreamPath);
            let value;
            for await (const line of stream) {
                value = line;
                break;
            }
            expect(stream).toBeInstanceOf(Interface);
            expect(value).toEqual(mockFileStreamContent);
        });
    });

    describe('method: readDirectory', () => {
        it('should read the root dir content', async () => {
            const value = await storage.readDirectory();
            expect(value.length).toBeGreaterThan(0);
        });

        it('should read the dir content', async () => {
            const value = await storage.readDirectory(mockDir);
            expect(value).toEqual(mockDirContentList);
        });

        it('should return null', async () => {
            const value = await storage.readDirectory('unexistent');
            expect(value).toEqual([]);
        });
    });

    describe('method: getDirectoryContentLength', () => {
        it('get root directory length', async () => {
            const value = await storage.getDirectoryContentLength();
            expect(value).toBeGreaterThan(0);
        });

        it('get directory length', async () => {
            const value = await storage.getDirectoryContentLength(mockDir);
            expect(value).toBeGreaterThan(0);
        });

        it('should get no content length from unexistent directory', async () => {
            const value = await storage.getDirectoryContentLength('unexistent');
            expect(value).toEqual(0);
        });
    });

    describe('method: checkDirectoryContentLength', () => {
        it('check if root dir exists', async () => {
            const value = await storage.checkDirectoryContentLength();
            expect(value).toBeTruthy();
        });

        it('check if some dir exists', async () => {
            const value = await storage.checkDirectoryContentLength(mockDir);
            expect(value).toBeTruthy();
        });

        it('check unexistent dir', async () => {
            const value = await storage.checkDirectoryContentLength('unexistent');
            expect(value).toBeFalsy();
        });
    });

    describe('method: deleteFile', () => {
        it('should delete the file', async () => {
            await storage.deleteFile(mockFilePath);
            await expect(storage.readContent(mockFilePath)).rejects.toThrow();
        });
    });

    describe('method: deleteDirectory', () => {
        it('should delete the directory', async () => {
            const _path = [mockDir, mockSubdir].join('/');
            await storage.deleteDirectory(_path);
            expect(await storage.checkDirectoryExists(mockDir)).toBeFalsy();
        });
    });
});
