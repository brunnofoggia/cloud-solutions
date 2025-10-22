import '@test/common/jest.test';
import dotenv from 'dotenv';
import { cloneDeep, isPlainObject } from 'lodash';
import { validate, version } from 'uuid';

import { KeycloakProvider, KeycloakProviderDefaultOptions } from './provider';
import {
    mockAuthenticated,
    mockUserInfo,
    mockUserSearch,
    mockRoleSearch,
    mockUserRegistry,
    mockUserRegistered,
    mockFindUserIdByUsername,
    mockRoleList,
    mockRoleId,
    mockAuthenticatedAgain,
} from '../../../test/mocks/thirdparty/keycloak.mock';
import { ERROR_CODE } from './error';
import { sleep } from '../../common/utils';

// Carrega variáveis de ambiente para teste
dotenv.config({ path: 'test/env/thirdparty/keycloak/.env', quiet: true });

describe('KeycloakProvider', () => {
    let keycloakProvider: KeycloakProvider;
    let mockHttp: boolean = process.env.KEYCLOAK_MOCK_ACTIVE === '1';
    const testConfig: any = {
        baseUrl: process.env.KEYCLOAK_BASE_URL,
        adminBaseUrl: process.env.KEYCLOAK_ADMIN_BASE_URL,
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
        keycloakProvider.uuid = { validate, version };
    });

    describe('Inicialização', () => {
        it('deve instanciar com configurações do .env', () => {
            expect(keycloakProvider).toBeDefined();
            expect(keycloakProvider).toBeInstanceOf(KeycloakProvider);
        });
    });

    describe('Métodos Básicos', () => {
        it('deve ter propriedades de configuração definidas', () => {
            expect(keycloakProvider['baseUrl']).toBe(testConfig.baseUrl);
            expect(keycloakProvider['clientId']).toBe(testConfig.clientId);
            expect(keycloakProvider['clientSecret']).toBe(testConfig.clientSecret);
            expect(keycloakProvider['realm']).toBe(testConfig.realm);
            expect(keycloakProvider.getRequestBasePath()).toBe(testConfig.finalBaseUrl);
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
            expect(keycloakProvider.buildAuthPath(authUrl)).toBe(authUrl);
        });

        it('deve substituir authUrl corretamente', () => {
            expect(keycloakProvider.buildAuthPath(testConfig.authPath)).toBe(KeycloakProviderDefaultOptions.authPath);
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
            mockHttp && (keycloakProvider._http = jest.fn().mockResolvedValueOnce(mockAuthenticated));
            await keycloakProvider.auth({ username: testConfig.username, password: testConfig.password });

            expect(keycloakProvider.token).toBeDefined();
            expect(typeof keycloakProvider.token).toBe('string');
            expect(keycloakProvider.token.length).toBeGreaterThan(100);
        });

        it('deve simular obtenção de informações do usuário', async () => {
            expect.assertions(3);

            mockHttp && (keycloakProvider._http = jest.fn().mockResolvedValueOnce(mockAuthenticated));
            await keycloakProvider.auth({ username: testConfig.username, password: testConfig.password });

            mockHttp && (keycloakProvider._http = jest.fn().mockResolvedValueOnce(mockUserInfo));
            const result = await keycloakProvider.introspect();

            expect(result.data.given_name.length).toBeGreaterThan(3);
            expect(result.data.name.length).toBeGreaterThan(3);
            expect(result.data.exp).toBeGreaterThan(1760000000);
        });

        it('deve ler dados apos autenticação', async () => {
            mockHttp && (keycloakProvider._http = jest.fn().mockResolvedValueOnce(mockAuthenticated));
            const { response } = await keycloakProvider.auth({ username: testConfig.username, password: testConfig.password });
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
            mockHttp && (keycloakProvider._http = jest.fn().mockResolvedValueOnce(mockAuthenticated));
            await keycloakProvider.auth({ username: testConfig.username, password: testConfig.password });

            const firstToken = keycloakProvider.token;
            expect(firstToken).toBeDefined();
            expect(typeof firstToken).toBe('string');
            expect(firstToken.length).toBeGreaterThan(100);

            // Simula refresh token
            mockHttp && (keycloakProvider._http = jest.fn().mockResolvedValueOnce(mockAuthenticatedAgain));
            await sleep(100);
            await keycloakProvider.refreshAccessToken();

            const secondToken = keycloakProvider.token;
            expect(secondToken).not.toBe(firstToken);
        });
    });

    describe('Admin Helpers', () => {
        it('deve simular busca de usuário por nome', async () => {
            expect.assertions(5);
            mockHttp && (keycloakProvider._http = jest.fn().mockResolvedValueOnce(mockAuthenticated));
            await keycloakProvider.auth({ username: testConfig.username, password: testConfig.password });

            mockHttp && (keycloakProvider._http = jest.fn().mockResolvedValueOnce({ data: [mockUserSearch], status: 200 }));
            const result = await keycloakProvider.searchUsersByUsername(testConfig.username);

            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data.length).toBe(1);
            expect(result.data[0]).toHaveProperty('id');
            expect(result.data[0].username.split('@')[0]).toBe(mockUserInfo.data.aliasForTesting);
        });

        it('deve simular busca de role por nome', async () => {
            expect.assertions(4);

            mockHttp && (keycloakProvider._http = jest.fn().mockResolvedValueOnce(mockAuthenticated));
            await keycloakProvider.auth({ username: testConfig.username, password: testConfig.password });

            mockHttp && (keycloakProvider._http = jest.fn().mockResolvedValueOnce({ data: mockRoleId, status: 204 }));
            const result = await keycloakProvider.findRoleDataByName(mockRoleId.name);
            console.log('result', result);

            expect(result.data).toBeDefined();
            expect(result.data.name).toBe('offline_access');
            expect(result.data.id).toBeDefined();
            expect(keycloakProvider.uuidCheck(result.data.id)).toBe(true);
        });

        it('deve simular registro de usuário', async () => {
            expect.assertions(3);

            mockHttp && (keycloakProvider._http = jest.fn().mockResolvedValueOnce(mockAuthenticated));
            await keycloakProvider.auth({ username: testConfig.username, password: testConfig.password });

            mockHttp && (keycloakProvider._http = jest.fn().mockResolvedValueOnce(mockUserRegistered));
            const responseResult = await keycloakProvider.registerUser(mockUserRegistry);

            expect(responseResult.userId).toBeDefined();
            expect(responseResult.userId.length).toBeGreaterThan(30);
            expect(keycloakProvider.uuidCheck(responseResult.userId)).toBe(true);
        });

        it('deve cadastrar senha para usuário registrado', async () => {
            expect.assertions(1);

            mockHttp && (keycloakProvider._http = jest.fn().mockResolvedValueOnce(mockAuthenticated));
            await keycloakProvider.auth({ username: testConfig.username, password: testConfig.password });

            mockHttp && (keycloakProvider._http = jest.fn().mockResolvedValueOnce(mockFindUserIdByUsername));
            const userId = await keycloakProvider.findUserIdByUsername(mockUserRegistry.username);

            mockHttp && (keycloakProvider._http = jest.fn().mockResolvedValueOnce({ status: 204 }));
            const responseResult = await keycloakProvider.resetPasswordByUserId(userId, {
                type: 'password',
                value: 'NewP@ssw0rd!',
                temporary: false,
            });
            expect(responseResult.status).toBe(204);
        });

        it('deve simular atribuição de role a usuário por id', async () => {
            expect.assertions(1);

            mockHttp && (keycloakProvider._http = jest.fn().mockResolvedValueOnce(mockAuthenticated));
            await keycloakProvider.auth({ username: testConfig.username, password: testConfig.password });

            mockHttp && (keycloakProvider._http = jest.fn().mockResolvedValueOnce(mockFindUserIdByUsername));
            const userId = await keycloakProvider.findUserIdByUsername(mockUserRegistry.username);

            // mock for both role search and role assignment requests
            mockHttp && (keycloakProvider._http = jest.fn().mockResolvedValue({ data: mockRoleId, status: 204 }));
            const responseResult = await keycloakProvider.registerRoleByNameToUserId(userId, mockRoleList);
            expect(responseResult.status).toBe(204);
        });
    });
});
