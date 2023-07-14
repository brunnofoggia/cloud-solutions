import dotenv from 'dotenv';
import { ParameterStore } from '.';
import { mockInvalidPath, mockParameter, mockParameterKeys, mockPath, mockSecret } from '@test/mocks/aws/secrets.mock';
import AWS from 'aws-sdk';
import { keys, pick } from 'lodash';

dotenv.config({ path: 'test/env/aws/.env' });

describe('Aws Secrets', () => {
    let secrets: ParameterStore;

    beforeAll(async () => {
        const providerOptions = {
            region: process.env.CLOUD_REGION,
            user: process.env.CLOUD_USER,
            pass: process.env.CLOUD_PASS,
        };
        secrets = new ParameterStore(providerOptions);
        await secrets.initialize();
    });

    describe('to be defined', () => {
        it('secrets', async () => {
            expect(secrets).toBeDefined();
        });
    });

    describe('method: getInstance', () => {
        it('value should be instance of AWS SSM', async () => {
            const value = await secrets.getInstance();
            expect(value).toBeInstanceOf(AWS.SSM);
        });
    });

    describe('method: createInstance', () => {
        it('value should be instance of AWS SSM', async () => {
            const value = await secrets.createInstance();
            expect(value).toBeInstanceOf(AWS.SSM);
        });
    });

    describe('method: getSecretValue', () => {
        it('should return the secret value', async () => {
            const value = await secrets.getSecretValue(mockPath);
            expect(value).toEqual(mockSecret);
        });

        it('invalid path should throw and error', async () => {
            await expect(secrets.getSecretValue(mockInvalidPath)).rejects.toThrow();
        });
    });

    describe('method: request', () => {
        it('should return the parameter promise', async () => {
            const value = await secrets.request('getParameter', { Name: mockPath });
            expect(keys(pick(value?.Parameter || {}, ...mockParameterKeys))).toEqual(mockParameterKeys);
        });

        it('invalid path should throw and error', async () => {
            await expect(secrets.request('', mockInvalidPath)).rejects.toThrow();
        });
    });

    describe('method: getParameterFromCloud', () => {
        it('should return the parameter data', async () => {
            const value = await secrets.getParameterFromCloud(mockPath);
            expect(value).toMatchObject(mockParameter);
        });

        it('invalid path should throw and error', async () => {
            await expect(secrets.getParameterFromCloud(mockInvalidPath)).rejects.toThrow();
        });
    });
});
