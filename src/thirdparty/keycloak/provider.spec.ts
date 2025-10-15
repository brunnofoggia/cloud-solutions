import dotenv from 'dotenv';
import { cloneDeep, isPlainObject } from 'lodash';
import '@test/common/jest.test';

import { KeycloakProvider, KeycloakProviderDefaultOptions } from './provider';
import { mockAuthenticated, mockUserInfo } from '../../../test/mocks/thirdparty/keycloak.mock';
import { ERROR_CODE } from './error';
import { sleep } from '../../common/utils';

// Carrega variáveis de ambiente para teste
dotenv.config({ path: 'test/env/thirdparty/keycloak/.env', quiet: true });

describe('KeycloakProvider', () => {
    let keycloakProvider: KeycloakProvider;

    const testConfig: any = {
        baseUrl: process.env.KEYCLOAK_BASE_URL,
        realm: process.env.KEYCLOAK_REALM,
        clientId: process.env.KEYCLOAK_CLIENT_ID,
        clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
        username: process.env.KEYCLOAK_USERNAME,
        password: process.env.KEYCLOAK_PASSWORD,
    };
    testConfig.finalBaseUrl = [testConfig.baseUrl, 'realms', testConfig.realm].join('/');

    beforeEach(async () => {
        jest.clearAllMocks();
        keycloakProvider = new KeycloakProvider();
        await keycloakProvider.initialize(cloneDeep(testConfig));
    });

    describe('Inicialização', () => {
        it('deve instanciar com configurações do .env', () => {
            expect(keycloakProvider).toBeDefined();
            expect(keycloakProvider).toBeInstanceOf(KeycloakProvider);
        });
    });

    describe('Métodos Básicos', () => {
        it('deve ter propriedades de configuração definidas', () => {
            expect(keycloakProvider['baseUrl']).toBe(testConfig.finalBaseUrl);
            expect(keycloakProvider['clientId']).toBe(testConfig.clientId);
            expect(keycloakProvider['clientSecret']).toBe(testConfig.clientSecret);
        });

        it('não deve aceitar ausencia de configurações', () => {
            expect(() => keycloakProvider.prepareInitializeOptions([])).toThrowCode(ERROR_CODE.KC_NO_OPTIONS_PROVIDED);
        });

        it('não deve aceitar configurações inválidas (baseUrl)', () => {
            const invalidConfig = cloneDeep(testConfig);
            invalidConfig.baseUrl = '';
            expect(() => keycloakProvider.initialize(invalidConfig)).rejects.toThrowCode(ERROR_CODE.KC_EMPTY_BASE_URL);
        });

        it('não deve aceitar configurações inválidas (realm)', () => {
            const invalidConfig = cloneDeep(testConfig);
            invalidConfig.realm = '';
            expect(() => keycloakProvider.initialize(invalidConfig)).rejects.toThrowCode(ERROR_CODE.KC_EMPTY_REALM);
        });

        it('não deve aceitar configurações inválidas (clientId)', () => {
            const invalidConfig = cloneDeep(testConfig);
            invalidConfig.clientId = '';
            expect(() => keycloakProvider.initialize(invalidConfig)).rejects.toThrowCode(ERROR_CODE.KC_EMPTY_CLIENT_ID);
        });

        it('não deve aceitar configurações inválidas (clientSecret)', () => {
            const invalidConfig = cloneDeep(testConfig);
            invalidConfig.clientSecret = '';
            expect(() => keycloakProvider.initialize(invalidConfig)).rejects.toThrowCode(ERROR_CODE.KC_EMPTY_CLIENT_SECRET);
        });
    });

    describe('Urls', () => {
        it('deve construir baseUrl corretamente', () => {
            expect(keycloakProvider.buildBaseUrl(testConfig.baseUrl, testConfig.realm)).toBe(testConfig.finalBaseUrl);
        });

        it('deve construir authUrl corretamente', () => {
            const authUrl = ['http://test.com', 'auth'].join('/');
            expect(keycloakProvider.buildAuthUrl(authUrl)).toBe(authUrl);
        });

        it('deve substituir authUrl corretamente', () => {
            expect(keycloakProvider.buildAuthUrl(testConfig.authPath)).toBe(KeycloakProviderDefaultOptions.authPath);
        });

        it('deve construir introspectUrl corretamente', () => {
            expect(keycloakProvider.buildIntrospectUrl()).toBe(
                [KeycloakProviderDefaultOptions.authPath, KeycloakProviderDefaultOptions.introspectPath].join('/'),
            );
        });
    });

    describe('Autenticação, Introspecção e Autorização', () => {
        it('deve simular chamada de autenticação', async () => {
            expect.assertions(3);
            // keycloakProvider._http = jest.fn().mockResolvedValue(mockAuthenticated);

            keycloakProvider._setAuth(testConfig.username, testConfig.password);
            await keycloakProvider.auth();

            expect(keycloakProvider.token).toBeDefined();
            expect(typeof keycloakProvider.token).toBe('string');
            expect(keycloakProvider.token.length).toBeGreaterThan(100);
        });

        it('deve simular obtenção de informações do usuário', async () => {
            expect.assertions(3);
            keycloakProvider._setAuth(testConfig.username, testConfig.password);

            // keycloakProvider._http = jest.fn().mockResolvedValueOnce(mockAuthenticated);
            await keycloakProvider.auth();

            // keycloakProvider._http = jest.fn().mockResolvedValueOnce(mockUserInfo);
            const result = await keycloakProvider.introspect();

            expect(result.data.given_name.length).toBeGreaterThan(3);
            expect(result.data.name.length).toBeGreaterThan(3);
            expect(result.data.exp).toBeGreaterThan(1760000000);
        });

        it('deve ler dados apos autenticação', async () => {
            keycloakProvider._setAuth(testConfig.username, testConfig.password);

            // keycloakProvider._http = jest.fn().mockResolvedValueOnce(mockAuthenticated);
            const { response } = await keycloakProvider.auth();
            const data = keycloakProvider.readResponse(response);

            expect(isPlainObject(data)).toBe(true);
            expect(data).toHaveProperty('expiresIn');
            expect(data).toHaveProperty('tokenType');
            expect(data).toHaveProperty('sessionState');
            expect(data).toHaveProperty('scope');
            expect(data.accessToken.length).toBeGreaterThan(100);
            expect(data.refreshToken.length).toBeGreaterThan(100);
        });
    });

    describe('Refresh Token', () => {
        it('deve simular refresh token', async () => {
            expect.assertions(4);
            keycloakProvider._setAuth(testConfig.username, testConfig.password);

            // keycloakProvider._http = jest.fn().mockResolvedValueOnce(mockAuthenticated);
            await keycloakProvider.auth();

            const firstToken = keycloakProvider.token;
            expect(firstToken).toBeDefined();
            expect(typeof firstToken).toBe('string');
            expect(firstToken.length).toBeGreaterThan(100);

            // Simula refresh token
            // keycloakProvider._http = jest.fn().mockResolvedValueOnce(mockAuthenticated);
            await sleep(100);
            await keycloakProvider.refreshAccessToken();

            const secondToken = keycloakProvider.token;
            expect(secondToken).not.toBe(firstToken);
        });
    });
});
