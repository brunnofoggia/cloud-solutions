import { KeycloakProviderOptions } from './interface';
import { KeycloakProvider } from './provider';
import { AxiosResponse } from 'axios';

describe('KeycloakProvider', () => {
    let provider: KeycloakProvider;
    let mockOptions: KeycloakProviderOptions;

    beforeEach(() => {
        provider = new KeycloakProvider();
        mockOptions = {
            baseUrl: 'https://keycloak.example.com',
            realm: 'test-realm',
            authPath: '/protocol/openid-connect/token',
            authResTokenField: 'access_token',
            authResRefreshTokenField: 'refresh_token',
            clientId: 'test-client',
            clientSecret: 'test-secret',
            authGrantType: 'password',
            scope: 'openid',
        };
    });

    describe('initialize', () => {
        it('should initialize with provided options', async () => {
            const setupSpy = jest.spyOn(provider, 'setupIntegration');

            await provider.initialize(mockOptions);
            expect(setupSpy).toHaveBeenCalledWith(mockOptions);
        });

        it('should not initialize when no args provided', async () => {
            expect.assertions(2);
            const setupSpy = jest.spyOn(provider, 'setupIntegration');

            await expect(async () => provider.initialize()).rejects.toThrow();
            expect(setupSpy).not.toHaveBeenCalled();
        });
    });

    describe('checkIntegrationOptions', () => {
        it('should throw error when baseUrl is missing', () => {
            const options = { ...mockOptions, baseUrl: '' };

            expect(() => provider.checkIntegrationOptions(options)).toThrow('Base URL is required');
        });

        it('should throw error when realm is missing', () => {
            const options = { ...mockOptions, realm: '' };

            expect(() => provider.checkIntegrationOptions(options)).toThrow('Realm is required');
        });

        it('should throw error when clientId is missing', () => {
            const options = { ...mockOptions, clientId: '' };

            expect(() => provider.checkIntegrationOptions(options)).toThrow('Client ID is required');
        });

        it('should throw error when clientSecret is missing', () => {
            const options = { ...mockOptions, clientSecret: '' };

            expect(() => provider.checkIntegrationOptions(options)).toThrow('Client Secret is required');
        });

        it('should not throw error when all required options are provided', () => {
            expect(() => provider.checkIntegrationOptions(mockOptions)).not.toThrow();
        });
    });

    describe('setupIntegration', () => {
        it('should setup integration with provided options', () => {
            provider.setupIntegration(mockOptions);

            expect(provider.baseUrl).toBe('https://keycloak.example.com/realms/test-realm');
            expect(provider.clientId).toBe('test-client');
            expect(provider.clientSecret).toBe('test-secret');
            expect(provider.authPath).toBe('/protocol/openid-connect/token');
            expect(provider.authResTokenField).toBe('access_token');
            expect(provider.authResRefreshTokenField).toBe('refresh_token');
            expect(provider.authGrantType).toBe('password');
            expect(provider.scope).toBe('openid');
        });

        it('should use default values for optional fields', () => {
            const minimalOptions = {
                baseUrl: 'https://keycloak.example.com',
                realm: 'test-realm',
                clientId: 'test-client',
                clientSecret: 'test-secret',
            } as KeycloakProviderOptions;

            provider.setupIntegration(minimalOptions);

            expect(provider.authPath).toBe('/protocol/openid-connect/token');
            expect(provider.authResTokenField).toBe('access_token');
            expect(provider.authResRefreshTokenField).toBe('refresh_token');
            expect(provider.authGrantType).toBe('password');
            expect(provider.scope).toBe('openid');
        });
    });

    describe('authReqOptionBody', () => {
        it('should return auth request body with keycloak specific fields', () => {
            provider.setupIntegration(mockOptions);
            jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(provider)), 'authReqOptionBody').mockReturnValue({});

            const body = provider.authReqOptionBody();

            expect(body).toEqual({
                client_id: 'test-client',
                client_secret: 'test-secret',
                grant_type: 'password',
                scope: 'openid',
            });
        });
    });

    describe('authResHandle', () => {
        it('should handle auth response and extract refresh token', () => {
            const mockResponse = {
                data: {
                    access_token: 'test-token',
                    refresh_token: 'test-refresh-token',
                },
            } as AxiosResponse;

            jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(provider)), 'authResHandle').mockReturnValue('test-token');
            provider.setupIntegration(mockOptions);

            const token = provider.authResHandle(mockResponse);

            expect(token).toBe('test-token');
            expect(provider.refreshToken).toBe('test-refresh-token');
        });
    });

    describe('getRefreshTokenFromResponse', () => {
        it('should extract refresh token from response data', () => {
            const mockResponse = {
                data: {
                    refresh_token: 'test-refresh-token',
                },
            } as AxiosResponse;

            provider.setupIntegration(mockOptions);

            const refreshToken = provider.getRefreshTokenFromResponse(mockResponse);

            expect(refreshToken).toBe('test-refresh-token');
        });

        it('should return empty string when refresh token field is not found', () => {
            const mockResponse = {
                data: {},
            } as AxiosResponse;

            provider.setupIntegration(mockOptions);

            const refreshToken = provider.getRefreshTokenFromResponse(mockResponse);

            expect(refreshToken).toBe('');
        });
    });

    // describe('refreshAccessToken', () => {
    // it('should call debug method', async () => {
    //     const debugSpy = jest.spyOn(provider, 'debug').mockImplementation();

    //     await provider.refreshAccessToken();

    //     expect(debugSpy).toHaveBeenCalledWith('refreshing access token');
    // });
    // });
});
