import dotenv from 'dotenv';
dotenv.config({ path: 'test/env/thirdparty/.env' });

import { Sftp } from '.';
import { Interface } from 'readline';
import SftpClient from 'fs';
// import SftpClient from 'ssh2-sftp-client';

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
import { sleep } from '@/common/utils';
import { WriteStream } from './writeStream';

describe('Sftp Storage', () => {
    let storage: Sftp;

    beforeAll(async () => {
        const providerOptions = {
            host: process.env.STORAGE_A_HOST,
            port: process.env.STORAGE_A_PORT,
            user: process.env.STORAGE_A_USER,
            pass: process.env.STORAGE_A_PASS,
            privateKey: process.env.STORAGE_A_PRIVATEKEY,
        };

        storage = new Sftp(providerOptions);
        // await storage.initialize({ stayConnected: false });
        await storage.initialize({ stayConnected: true, basePath: process.env.STORAGE_A_BASEPATH });
    }, 10000);

    afterAll(async () => {
        try {
            await storage.closeInstance();
        } catch (error) {
            console.log('Error closing storage instance', error);
        }
    });

    describe('to be defined', () => {
        it('storage', async () => {
            toBeDefined.storage(storage);
        });
    });

    describe('specific method: getInstance', () => {
        it('should be instance of sftp.client', async () => {
            await getInstance.shouldBeInstanceOf(storage, SftpClient);
        });
    });

    // describe('specific method: createInstance', () => {
    //     it('should fail to connect', async () => {
    //         const instance = await createInstance.shouldBeInstanceOf(storage, SftpClient, {
    //             host: process.env.STORAGE_C_HOST,
    //             port: process.env.STORAGE_C_PORT,
    //             user: process.env.STORAGE_C_USER,
    //             pass: process.env.STORAGE_C_PASS,
    //         });
    //         storage._closeInstance(instance);
    //     }, 20000);

    //     it('should fail to connect', async () => {
    //         await createInstance.shouldFail(storage, SftpClient, {
    //             host: process.env.STORAGE_B_HOST,
    //             port: process.env.STORAGE_B_PORT,
    //             user: process.env.STORAGE_B_USER,
    //             pass: process.env.STORAGE_B_PASS,
    //         });
    //     });
    // });

    describe('common method: checkOptions', () => {
        it('should be valid', () => {
            checkOptions.shouldBeValid(storage);
        });
        it('should throw error', async () => {
            await checkOptions.shouldThrowError(Sftp);
        });
    });

    describe('common method: sendContent', () => {
        it('upload file', async () => {
            await sendContent.uploadFile(storage);
        }, 30000);

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

    // describe('common method: readDirectory', () => {
    //     it('should have content', async () => {
    //         await readDirectory.shouldHaveContent(storage);
    //     });

    //     it('should match content list', async () => {
    //         await readDirectory.shouldMatchContentList(storage);
    //     });

    //     it('should have nothing', async () => {
    //         await readDirectory.shouldHaveNothing(storage);
    //     });
    // });

    // describe('common method: getDirectoryContentLength', () => {
    //     it('should have something into rootdir', async () => {
    //         await getDirectoryContentLength.shouldHaveSomethingIntoRootdir(storage);
    //     });

    //     it('should have something into dir', async () => {
    //         await getDirectoryContentLength.shouldHaveSomethingIntoDir(storage);
    //     });

    //     it('should have nothing into unexistent directory', async () => {
    //         await getDirectoryContentLength.shouldHaveNothingIntoUnexistentDirectory(storage);
    //     });
    // });

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

    // describe('common method: getFileInfo', () => {
    //     it('should return file info', async () => {
    //         await getFileInfo.shouldReturnFileInfo(storage);
    //     });

    //     it('should throw error for unexistent file', async () => {
    //         await getFileInfo.shouldThrowErrorForUnexistentFile(storage);
    //     });
    // });

    // describe('common method: deleteFile', () => {
    //     it('should do', async () => {
    //         await deleteFile.shouldDo(storage);
    //     });
    // });

    // describe('common method: deleteDirectory', () => {
    //     it('should delete recursively', async () => {
    //         await deleteDirectory.shouldDeleteRecursively(storage);
    //     });

    //     it('should omit deletion of unexistent directory', async () => {
    //         await deleteDirectory.shouldOmitDeletionOfUnexistentDirectory(storage);
    //     });
    // });
});
