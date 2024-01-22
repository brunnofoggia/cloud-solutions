import dotenv from 'dotenv';
dotenv.config({ path: 'test/env/gcp/.env' });
import { Storage as GStorage } from '@google-cloud/storage';
import { Storage } from '.';
import { Interface } from 'readline';

import {
    checkDirectoryContentLength,
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
} from '@/common/abstract/storage.test';
import { WriteStream } from './writeStream';

describe('Gcp Storage', () => {
    let storage: Storage;

    beforeAll(async () => {
        const providerOptions = {
            region: process.env.CLOUD_REGION,
            user: process.env.CLOUD_USER,
            pass: process.env.CLOUD_PASS,
            project: process.env.CLOUD_PROJECT,
        };
        const Bucket = process.env.STORAGE_BUCKET;

        storage = new Storage(providerOptions);
        await storage.initialize({ Bucket });
    });

    describe('to be defined', () => {
        it('storage', async () => {
            await toBeDefined.storage(storage);
        });
    });

    describe('common method: checkOptions', () => {
        it('should be valid', () => {
            checkOptions.shouldBeValid(storage);
        });
        it('should throw error', async () => {
            await checkOptions.shouldThrowError(Storage);
        });
    });

    describe('specific method: getInstance', () => {
        it('should be instance of GStorage', async () => {
            await getInstance.shouldBeInstanceOf(storage, GStorage);
        });
    });

    describe('specific method: createInstance', () => {
        it('value should be instance of GStorage', async () => {
            await createInstance.shouldBeInstanceOf(storage, GStorage);
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

    describe('common method: checkDirectoryContentLength', () => {
        it('should exist rootdir', async () => {
            await checkDirectoryContentLength.shouldExistRootdir(storage);
        });

        it('should exist dir', async () => {
            await checkDirectoryContentLength.shouldExistDir(storage);
        });

        it('should not exist', async () => {
            await checkDirectoryContentLength.shouldNotExist(storage);
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
