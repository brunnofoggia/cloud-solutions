import dotenv from 'dotenv';
dotenv.config({ path: 'test/env/secrets.env' });
import { Env } from './index';
import { mockFormattedPath, mockPath, mockSecret, mockUndefinedPath } from '@test/mocks/secrets.mock';

describe('Secrets', () => {
    let secrets: Env;

    beforeEach(() => {
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
            const spyFormatPath = jest.spyOn(secrets, 'formatPath');
            const value = await secrets.formatPath(mockPath);
            expect(spyFormatPath).toHaveBeenCalledWith(mockPath);
            expect(value).toEqual(mockFormattedPath);
        });
    });

    describe('method: getSecretValue', () => {
        it('should return the secret value', async () => {
            const spyGetSecretValue = jest.spyOn(secrets, 'getSecretValue');
            const value = await secrets.getSecretValue(mockPath);
            expect(spyGetSecretValue).toHaveBeenCalledWith(mockPath);
            expect(value).toEqual(mockSecret);
        });
        it('should return undefined value', async () => {
            const spyGetSecretValue = jest.spyOn(secrets, 'getSecretValue');
            const value = await secrets.getSecretValue(mockUndefinedPath);
            expect(spyGetSecretValue).toHaveBeenCalledWith(mockUndefinedPath);
            expect(value).toBeUndefined();
        });
    });

    describe('method: getValue', () => {
        it('should return the value', async () => {
            const spyGetValue = jest.spyOn(secrets, 'getValue');
            const value = await secrets.getValue(mockPath);
            expect(spyGetValue).toHaveBeenCalledWith(mockPath);
            expect(value).toEqual(mockSecret);
        });
        it('should return undefined value', async () => {
            const spyGetValue = jest.spyOn(secrets, 'getValue');
            const value = await secrets.getValue(mockUndefinedPath);
            expect(spyGetValue).toHaveBeenCalledWith(mockUndefinedPath);
            expect(value).toBeUndefined();
        });
    });
});
