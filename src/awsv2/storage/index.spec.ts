import dotenv from 'dotenv';
dotenv.config({ path: 'test/env/aws/.env' });

import { S3 } from '.';
import AWS from 'aws-sdk';
import { Interface } from 'readline';

import { WriteStream } from './writeStream';
import {
    checkPathExists,
    checkOptions,
    createInstance,
    deleteDirectory,
    deleteFile,
    getDirectoryContentLength,
    getInstance,
    readContent,
    readDirectory,
    readStream,
    sendContent,
    sendStream,
    toBeDefined,
    getVariables,
    getFileInfo,
} from '@/common/abstract/storage.test';
import { sleep } from '@/common/utils';

describe('Aws Storage', () => {
    let storage: S3;

    beforeAll(async () => {
        const providerOptions = {
            region: process.env.CLOUD_REGION,
            user: process.env.CLOUD_USER,
            pass: process.env.CLOUD_PASS,
        };
        const Bucket = process.env.STORAGE_BUCKET;
        storage = new S3(providerOptions);
        await storage.initialize({ Bucket });
    });

    describe('to be defined', () => {
        it('storage', async () => {
            toBeDefined.storage(storage);
        });
    });

    describe('specific method: getInstance', () => {
        it('should be instance of AWS.S3', async () => {
            await getInstance.shouldBeInstanceOf(storage, AWS.S3);
        });
    });

    describe('specific method: createInstance', () => {
        it('value should be instance of AWS.S3', async () => {
            await createInstance.shouldBeInstanceOf(storage, AWS.S3);
        });
    });

    describe('common method: checkOptions', () => {
        it('should be valid', () => {
            checkOptions.shouldBeValid(storage);
        });
        it('should throw error', async () => {
            await checkOptions.shouldThrowError(S3);
        });
    });

    describe('common method: sendContent', () => {
        it('upload file', async () => {
            await sendContent.uploadFile(storage);
        });

        it('upload file into subdirectory', async () => {
            await sendContent.uploadFileIntoSubDirectory(storage);
        });
    });

    describe('common method: readContent', () => {
        it('should match content', async () => {
            await readContent.shouldMatchContent(storage);
        });

        it('should throw error for unexistent file', async () => {
            await readContent.shouldThrowErrorForUnexistentFile(storage);
        });
    });

    describe('common method: sendStream', () => {
        it('should return instance of WriteStream', async () => {
            await sendStream.shouldReturnInstanceOfWriteStream(storage, WriteStream);
        });

        it('should send short content', async () => {
            await sendStream.shouldSendShortContent(storage);
        });

        it('should send long content', async () => {
            await sendStream.shouldSendLongContent(storage);
        });
    });

    describe('common method: readStream', () => {
        it('should be instance of Interface', async () => {
            await readStream.shouldReturnInstanceOfInterface(storage, Interface);
        });

        it('should match content', async () => {
            await readStream.shouldMatchContent(storage);
        });
    });

    describe('common method: readDirectory', () => {
        it('should have content', async () => {
            await readDirectory.shouldHaveContent(storage);
        });

        it('should match content list', async () => {
            await readDirectory.shouldMatchContentList(storage);
        });

        it('should have nothing', async () => {
            await readDirectory.shouldHaveNothing(storage);
        });
    });

    describe('common method: getDirectoryContentLength', () => {
        it('should have something into rootdir', async () => {
            await getDirectoryContentLength.shouldHaveSomethingIntoRootdir(storage);
        });

        it('should have something into dir', async () => {
            await getDirectoryContentLength.shouldHaveSomethingIntoDir(storage);
        });

        it('should have nothing into unexistent directory', async () => {
            await getDirectoryContentLength.shouldHaveNothingIntoUnexistentDirectory(storage);
        });
    });

    describe('common method: checkPathExists', () => {
        it('should exist rootdir', async () => {
            await checkPathExists.shouldExistRootdir(storage);
        });

        it('should exist dir', async () => {
            await checkPathExists.shouldExistDir(storage);
        });

        it('should not exist', async () => {
            await checkPathExists.shouldNotExist(storage);
        });
    });

    describe('common method: getFileInfo', () => {
        it('should return file info', async () => {
            await getFileInfo.shouldReturnFileInfo(storage);
        });

        it('should throw error for unexistent file', async () => {
            await getFileInfo.shouldThrowErrorForUnexistentFile(storage);
        });
    });

    describe('specific method: copyFile', () => {
        it('should make a copy', async () => {
            expect.assertions(1);
            const { mockFilePath, mockCopyFilePath } = getVariables(storage);
            await expect(() => storage.copyFile(mockFilePath, mockCopyFilePath, { checkSize: false })).not.toThrow();
        });
    });

    describe('specific method: compareSize', () => {
        it('should compare source with destination size', async () => {
            expect.assertions(1);
            const { mockFilePath, mockCopyFilePath } = getVariables(storage);
            await expect(() => storage.compareSize(mockFilePath, mockCopyFilePath)).toBeTruthy();
        });
    });

    describe('specific method: copyFile + move', () => {
        it('should copy to and delete source ', async () => {
            expect.assertions(3);
            const { mockCopyFilePath, mockCopyBFilePath } = getVariables(storage);
            await expect(() => storage.copyFile(mockCopyFilePath, mockCopyBFilePath, { clear: true, move: true })).not.toThrow();
            await sleep(500);
            await expect(() => storage.getFileInfo(mockCopyFilePath)).rejects.toThrow();

            await storage.deleteFile(mockCopyBFilePath);
            await sleep(500);
            await expect(() => storage.readContent(mockCopyBFilePath)).rejects.toThrow();
        });
    });

    describe('common method: deleteFile', () => {
        it('should do', async () => {
            await deleteFile.shouldDo(storage);
        });
    });

    describe('common method: deleteDirectory', () => {
        it('should delete recursively', async () => {
            await deleteDirectory.shouldDeleteRecursively(storage);
        });

        it('should omit deletion of unexistent directory', async () => {
            await deleteDirectory.shouldOmitDeletionOfUnexistentDirectory(storage);
        });
    });
});
