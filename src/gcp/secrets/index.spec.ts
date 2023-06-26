import dotenv from 'dotenv';
import { SecretManager } from '.';
import { mockBuildedPath, mockFormattedPath, mockInvalidPath, mockPath, mockProjectId, mockSecret } from '@test/mocks/gcp/secrets.mock';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
dotenv.config({ path: 'test/env/gcp/.env' });

describe('Gcp Secrets', () => {
    let secrets: SecretManager;

    beforeAll(() => {
        const providerOptions = {
            region: process.env.CLOUD_REGION,
            user: process.env.CLOUD_USER,
            pass: process.env.CLOUD_PASS,
            project: process.env.CLOUD_PROJECT,
        };
        secrets = new SecretManager(providerOptions);
        secrets.initialize();
    });

    describe('to be defined', () => {
        it('secrets', async () => {
            expect(secrets).toBeDefined();
        });
    });

    describe('method: checkOptions', () => {
        it('should return true', () => {
            const value = secrets.checkOptions();
            expect(value).toBeTruthy();
        });
        it('throw error', () => {
            const instance = new SecretManager({});
            expect(async () => instance.checkOptions()).rejects.toThrow();
        });
    });

    describe('method: getProjectId', () => {
        it('should return the project id', () => {
            const value = secrets.getProjectId();
            expect(value).toEqual(mockProjectId);
        });
    });

    describe('method: getInstance', () => {
        it('value should be instance of SecretManager', async () => {
            const value = await secrets.getInstance();
            expect(value).toBeInstanceOf(SecretManagerServiceClient);
        });
    });

    describe('method: createInstance', () => {
        it('value should be instance of SecretManager', async () => {
            const value = secrets.createInstance();
            expect(value).toBeInstanceOf(SecretManagerServiceClient);
        });
    });

    describe('method: formatPath', () => {
        it('should replace "/" and "." with "_" in the path', async () => {
            const value = await secrets.formatPath(mockPath);
            expect(value).toEqual(mockFormattedPath);
        });
    });

    describe('method: buildPath', () => {
        it('should return builded path', () => {
            const value = secrets.buildPath(mockPath);
            expect(value).toEqual(mockBuildedPath);
        });
    });

    describe('method: getSecretValue', () => {
        it('should return the value', async () => {
            const value = await secrets.getSecretValue(mockPath);
            expect(value).toEqual(mockSecret);
        });
        it('throw error', async () => {
            await expect(secrets.getSecretValue(mockInvalidPath)).rejects.toThrow();
        });
    });
});
