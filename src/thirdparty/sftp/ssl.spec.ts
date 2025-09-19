import dotenv from 'dotenv';
dotenv.config({ path: 'test/env/thirdparty/.env', quiet: true });

import { Sftp } from '.';
import SftpClient from 'ssh2-sftp-client';

const globalTimeout = 15000;
const lifecycleTimeout = 2000;

const instantiate = async (providerOptions: any = {}, initializeOptions: any = {}) => {
    const storage = new Sftp(providerOptions);

    initializeOptions.connectionTimeout = -1;
    initializeOptions.autoCreateGlobalInstance = 0;

    await storage.initialize(initializeOptions);
    return storage;
};

const mainProviderOptions = () => {
    return {
        host: process.env.STORAGE_SSL_HOST,
        port: process.env.STORAGE_SSL_PORT,
        user: process.env.STORAGE_SSL_USER,
        pass: process.env.STORAGE_SSL_PASS,
        privateKey: process.env.STORAGE_SSL_PRIVATEKEY,
    };
};

const mainInitializeOptions = () => {
    return {
        Bucket: process.env.STORAGE_SSL_BASEPATH,
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
    }, lifecycleTimeout);

    afterAll(async () => {
        try {
            await storage?.closeInstance();
            storage = null;
            // console.log('jest: SFTP storage instance closed');
        } catch (error) {
            // console.log('jest: Error closing storage instance', error);
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
                const instance = await getInstance.shouldBeInstanceOf(storage, SftpClient);
                await storage._closeInstance(instance);
            },
            globalTimeout,
        );
    });

    describe('specific method: createInstance, guest no ssl', () => {
        it(
            'should connect with guest',
            async () => {
                const instance = await createInstance.shouldBeInstanceOf(storage, SftpClient, {
                    host: process.env.STORAGE_SSL_HOST,
                    port: process.env.STORAGE_SSL_PORT,
                    user: process.env.STORAGE_SSL_GUEST_USER,
                    pass: process.env.STORAGE_SSL_GUEST_PASS,
                });
                await storage._closeInstance(instance);
            },
            globalTimeout,
        );

        it(
            'should fail to connect with guest but wrong password',
            async () => {
                await createInstance.shouldFail(storage, SftpClient, {
                    host: process.env.STORAGE_SSL_HOST,
                    port: process.env.STORAGE_SSL_PORT,
                    user: process.env.STORAGE_SSL_GUEST_USER,
                    pass: 'wrong_password',
                });
            },
            globalTimeout,
        );
    });

    describe('specific method: createInstance, ssl', () => {
        it(
            'should connect successfully',
            async () => {
                const instance = await createInstance.shouldBeInstanceOf(storage, SftpClient, {
                    host: process.env.STORAGE_SSL_HOST,
                    port: process.env.STORAGE_SSL_PORT,
                    user: process.env.STORAGE_SSL_USER,
                    pass: process.env.STORAGE_SSL_PASS,
                    privateKey: process.env.STORAGE_SSL_PRIVATEKEY,
                });
                await storage._closeInstance(instance);
            },
            globalTimeout,
        );

        /* TODO: shouldnt be connecting */
        // it(
        //     'should fail to connect with invalid ssl key',
        //     async () => {
        //         await createInstance.shouldFail(storage, SftpClient, {
        //             host: process.env.STORAGE_SSL_HOST,
        //             port: process.env.STORAGE_SSL_PORT,
        //             user: process.env.STORAGE_SSL_USER,
        //             pass: process.env.STORAGE_SSL_PASS,
        //             privateKey: process.env.STORAGE_SSL_WRONG_PRIVATEKEY,
        //         });
        //     },
        //     globalTimeout,
        // );

        it(
            'should fail to connect with invalid ssl key and wrong password',
            async () => {
                await createInstance.shouldFail(storage, SftpClient, {
                    host: process.env.STORAGE_SSL_HOST,
                    port: process.env.STORAGE_SSL_PORT,
                    user: process.env.STORAGE_SSL_USER,
                    pass: 'wrong_password',
                    privateKey: process.env.STORAGE_SSL_WRONG_PRIVATEKEY,
                });
            },
            globalTimeout,
        );

        it(
            'should fail to connect with malformed ssl key',
            async () => {
                await createInstance.shouldFail(storage, SftpClient, {
                    host: process.env.STORAGE_SSL_HOST,
                    port: process.env.STORAGE_SSL_PORT,
                    user: process.env.STORAGE_SSL_USER,
                    pass: process.env.STORAGE_SSL_PASS,
                    privateKey: 'some_random_value',
                });
            },
            globalTimeout,
        );
    });

    describe('specific method: createInstance, ssl + passphrase', () => {
        it(
            'should connect successfully',
            async () => {
                const instance = await createInstance.shouldBeInstanceOf(storage, SftpClient, {
                    host: process.env.STORAGE_SSL_HOST,
                    port: process.env.STORAGE_SSL_PORT,
                    user: process.env.STORAGE_SSL_WITHPHRASE_USER,
                    privateKey: process.env.STORAGE_SSL_WITHPHRASE_PRIVATEKEY,
                    passphrase: process.env.STORAGE_SSL_WITHPHRASE_PASSPHRASE,
                });
                await storage._closeInstance(instance);
            },
            globalTimeout,
        );

        it(
            'should fail to connect with invalid passphrase',
            async () => {
                await createInstance.shouldFail(storage, SftpClient, {
                    host: process.env.STORAGE_SSL_HOST,
                    port: process.env.STORAGE_SSL_PORT,
                    user: process.env.STORAGE_SSL_USER,
                    privateKey: process.env.STORAGE_SSL_WITHPHRASE_PRIVATEKEY,
                    passphrase: 'wrong_passphrase',
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
    });
});
