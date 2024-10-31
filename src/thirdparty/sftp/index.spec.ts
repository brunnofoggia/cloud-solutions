import dotenv from 'dotenv';
dotenv.config({ path: 'test/env/thirdparty/.env' });

import { Sftp } from '.';
import { Interface } from 'readline';
import SftpClient from 'ssh2-sftp-client';

const globalTimeout = 15000;

const instantiate = async (providerOptions: any = {}, initializeOptions: any = {}) => {
    const storage = new Sftp(providerOptions);
    await storage.initialize(initializeOptions);
    return storage;
};

const mainProviderOptions = () => {
    return {
        host: process.env.STORAGE_A_HOST,
        port: process.env.STORAGE_A_PORT,
        user: process.env.STORAGE_A_USER,
        pass: process.env.STORAGE_A_PASS,
        privateKey: process.env.STORAGE_A_PRIVATEKEY,
    };
};

const mainInitializeOptions = () => {
    return {
        Bucket: process.env.STORAGE_A_BASEPATH,
    };
};

const mainInstantiate = async (options: any = {}) => {
    const providerOptions = mainProviderOptions();
    const initializeOptions = { ...options, ...mainInitializeOptions() };

    return await instantiate(providerOptions, initializeOptions);
};
// import { WriteStream } from './writeStream';
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
import { WriteStream } from './writeStream';

describe('Sftp Storage', () => {
    let storage: Sftp;
    let variables: any;

    beforeAll(async () => {
        storage = await mainInstantiate();
        variables = getVariables(storage);
    }, globalTimeout);

    afterAll(async () => {
        try {
            await storage.closeInstance();
        } catch (error) {
            console.log('Error closing storage instance', error);
        }
    });

    describe('to be defined', () => {
        it(
            'storage',
            async () => {
                toBeDefined.storage(storage);
            },
            globalTimeout,
        );
    });

    describe('specific method: getInstance', () => {
        it(
            'should be instance of sftp.client',
            async () => {
                await getInstance.shouldBeInstanceOf(storage, SftpClient);
            },
            globalTimeout,
        );
    });

    describe('specific method: createInstance', () => {
        it(
            'should connect successfully',
            async () => {
                const instance = await createInstance.shouldBeInstanceOf(storage, SftpClient, {
                    host: process.env.STORAGE_C_HOST,
                    port: process.env.STORAGE_C_PORT,
                    user: process.env.STORAGE_C_USER,
                    pass: process.env.STORAGE_C_PASS,
                });
                await storage._closeInstance(instance);
            },
            globalTimeout,
        );

        it(
            'should fail to connect',
            async () => {
                await createInstance.shouldFail(storage, SftpClient, {
                    host: process.env.STORAGE_A_HOST,
                    port: process.env.STORAGE_A_PORT,
                    user: process.env.STORAGE_A_USER,
                    pass: 'aaaaaaa',
                });
            },
            globalTimeout,
        );
    });

    describe('common method: checkOptions', () => {
        it(
            'should be valid',
            () => {
                checkOptions.shouldBeValid(storage);
            },
            globalTimeout,
        );
        it(
            'should throw error',
            async () => {
                await checkOptions.shouldThrowError(Sftp);
            },
            globalTimeout,
        );
    });

    describe('common method: sendContent', () => {
        it(
            'upload file',
            async () => {
                await sendContent.uploadFile(storage);
            },
            globalTimeout,
        );

        it(
            'upload file into subdirectory',
            async () => {
                await sendContent.uploadFileIntoSubDirectory(storage);
            },
            globalTimeout,
        );
    });

    describe('common method: readContent', () => {
        it(
            'should match content',
            async () => {
                await readContent.shouldMatchContent(storage);
            },
            globalTimeout,
        );

        it(
            'should throw error for unexistent file',
            async () => {
                await readContent.shouldThrowErrorForUnexistentFile(storage);
            },
            globalTimeout,
        );
    });

    describe('common method: sendStream', () => {
        it(
            'should return instance of WriteStream',
            async () => {
                await sendStream.shouldReturnInstanceOfWriteStream(storage, WriteStream);
            },
            globalTimeout,
        );

        it(
            'should send short content',
            async () => {
                await sendStream.shouldSendShortContent(storage);
            },
            globalTimeout,
        );

        it(
            'should send long content',
            async () => {
                await sendStream.shouldSendLongContent(storage);
            },
            globalTimeout,
        );
    });

    describe('common method: readStream', () => {
        it(
            'should be instance of Interface',
            async () => {
                await readStream.shouldReturnInstanceOfInterface(storage, Interface);
            },
            globalTimeout,
        );

        it(
            'should match content',
            async () => {
                await readStream.shouldMatchContent(storage);
            },
            globalTimeout,
        );
    });

    describe('common method: readDirectory', () => {
        it(
            'should have content',
            async () => {
                await readDirectory.shouldHaveContent(storage);
            },
            globalTimeout,
        );

        it(
            'should match content list',
            async () => {
                await readDirectory.shouldMatchContentList(storage);
            },
            globalTimeout,
        );

        it(
            'should have nothing',
            async () => {
                await readDirectory.shouldHaveNothing(storage);
            },
            globalTimeout,
        );
    });

    describe('common method: getDirectoryContentLength', () => {
        it(
            'should have something into rootdir',
            async () => {
                await getDirectoryContentLength.shouldHaveSomethingIntoRootdir(storage);
            },
            globalTimeout,
        );

        it(
            'should have something into dir',
            async () => {
                await getDirectoryContentLength.shouldHaveSomethingIntoDir(storage);
            },
            globalTimeout,
        );

        it(
            'should have nothing into unexistent directory',
            async () => {
                await getDirectoryContentLength.shouldHaveNothingIntoUnexistentDirectory(storage);
            },
            globalTimeout,
        );
    });

    describe('common method: checkPathExists', () => {
        it(
            'should exist file',
            async () => {
                await checkPathExists.shouldExistFile(storage);
            },
            globalTimeout,
        );

        it(
            'should exist dir',
            async () => {
                await checkPathExists.shouldExistDir(storage);
            },
            globalTimeout,
        );

        it(
            'should not exist',
            async () => {
                await checkPathExists.shouldNotExist(storage);
            },
            globalTimeout,
        );
    });

    describe('common method: getFileInfo', () => {
        it(
            'should return file info',
            async () => {
                await getFileInfo.shouldReturnFileInfo(storage);
            },
            globalTimeout,
        );

        it(
            'should throw error for unexistent file',
            async () => {
                await getFileInfo.shouldThrowErrorForUnexistentFile(storage);
            },
            globalTimeout,
        );
    });

    describe('common method: deleteFile', () => {
        it(
            'should do',
            async () => {
                await deleteFile.shouldDo(storage);
            },
            globalTimeout,
        );
    });

    describe('common method: deleteDirectory', () => {
        it(
            'should delete recursively',
            async () => {
                await deleteDirectory.shouldDeleteRecursively(storage);
            },
            globalTimeout,
        );

        it(
            'should omit deletion of unexistent directory',
            async () => {
                await deleteDirectory.shouldOmitDeletionOfUnexistentDirectory(storage);
            },
            globalTimeout,
        );
    });

    afterAll(async () => {
        await storage.closeInstance();
        storage = null;
    });
});
