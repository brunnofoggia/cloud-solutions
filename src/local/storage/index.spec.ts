import dotenv from 'dotenv';
dotenv.config({ path: 'test/env/local/.env' });

import { Fs } from '.';
import path from 'path';
import { Interface } from 'readline';

import {
    checkDirectoryContentLength,
    checkOptions,
    deleteDirectory,
    deleteFile,
    getDirectoryContentLength,
    readContent,
    readDirectory,
    readStream,
    sendContent,
    sendStream,
    toBeDefined,
} from '@/common/abstract/storage.test';
import { WriteStream } from './writeStream';

describe('Local Storage', () => {
    let storage: Fs;

    beforeAll(() => {
        const Bucket = process.env.STORAGE_BUCKET;
        const providerOptions = {};
        storage = new Fs(providerOptions);
        storage.initialize({ Bucket });
    });

    describe('to be defined', () => {
        it('storage', async () => {
            await toBeDefined.storage(storage);
        });
    });

    describe('specific method: checkOptions', () => {
        it('should be valid', () => {
            checkOptions.shouldBeValid(storage);
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

        it('should send content', async () => {
            await sendStream.shouldSendContent(storage);
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
