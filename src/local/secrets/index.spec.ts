import dotenv from 'dotenv';
dotenv.config({ path: 'test/env/local/.env' });
import { Env } from './index';
import { mockFormattedPath, mockPath, mockSecret, mockUndefinedPath } from '@test/mocks/local/secrets.mock';

describe('Local Secrets', () => {
    let secrets: Env;

    beforeAll(() => {
        const providerOptions = {};
        secrets = new Env(providerOptions);
    });

    describe('to be defined', () => {
        it('secrets', async () => {
            expect(secrets).toBeDefined();
        });
    });

    describe('method: formatPath', () => {
        it('should replace "/" and "." with "_" in the path', async () => {
            const value = await secrets.formatPath(mockPath);
            expect(value).toEqual(mockFormattedPath);
        });
    });

    describe('method: getSecretValue', () => {
        it('should return the secret value', async () => {
            const value = await secrets.getSecretValue(mockPath);
            expect(value).toEqual(mockSecret);
        });
        it('should return undefined value', async () => {
            const value = await secrets.getSecretValue(mockUndefinedPath);
            expect(value).toBeUndefined();
        });
    });
});
