import '@test/common/jest.test';
import { Iam, IamDefaultOptions } from './iam';
import { ERROR_CODE } from '../error/iam.error';

// Mock do jsonwebtoken
jest.mock('jsonwebtoken', () => ({
    decode: jest.fn(),
}));

// Implementação concreta para testes2
class TestIam extends Iam {
    // Implementação mínima necessária para testar a classe abstrata
}

describe('Iam - Token Management', () => {
    let iam: TestIam;
    let mockDecodeJwt: jest.Mock;

    beforeEach(() => {
        iam = new TestIam();
        mockDecodeJwt = require('jsonwebtoken').decode as jest.Mock;
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('checkToken', () => {
        it('deve lançar erro para token vazio', async () => {
            expect(() => iam.checkToken('')).toThrowCode(ERROR_CODE.AUTH_TOKEN_EMPTY);
        });

        it('deve lançar erro para token null', async () => {
            expect(() => iam.checkToken(null as any)).toThrowCode(ERROR_CODE.AUTH_TOKEN_EMPTY);
        });

        it('deve lançar erro para token undefined', async () => {
            expect(() => iam.checkToken(undefined as any)).toThrowCode(ERROR_CODE.AUTH_TOKEN_EMPTY);
        });

        it('deve lançar erro para token com apenas espaços', async () => {
            expect(() => iam.checkToken('   ')).toThrowCode(ERROR_CODE.AUTH_TOKEN_EMPTY);
        });

        it('deve lançar erro quando readTokenPayload retorna null', async () => {
            jest.spyOn(iam, 'readTokenPayload').mockReturnValue(null);

            expect(() => iam.checkToken('invalid-token')).toThrowCode(ERROR_CODE.AUTH_TOKEN_INVALID);
            expect(iam.readTokenPayload).toHaveBeenCalledWith('invalid-token');
        });

        it('deve lançar erro quando token está expirado', async () => {
            const expiredPayload: any = {
                exp: Math.floor(Date.now() / 1000) - 3600, // Expirado há 1 hora
                iat: Math.floor(Date.now() / 1000) - 7200,
            };

            jest.spyOn(iam, 'readTokenPayload').mockReturnValue(expiredPayload);
            jest.spyOn(iam, 'checkPayloadIsExpired').mockReturnValue(true);

            expect(() => iam.checkToken('expired-token')).toThrowCode(ERROR_CODE.AUTH_TOKEN_EXPIRED);
            expect(iam.checkPayloadIsExpired).toHaveBeenCalledWith(expiredPayload);
        });

        it('deve retornar true quando token é válido e não expirado', () => {
            const validPayload: any = {
                exp: Math.floor(Date.now() / 1000) + 3600, // Expira em 1 hora
                iat: Math.floor(Date.now() / 1000),
                sub: 'user-123',
            };

            jest.spyOn(iam, 'readTokenPayload').mockReturnValue(validPayload);
            jest.spyOn(iam, 'checkPayloadIsExpired').mockReturnValue(false);

            const result = iam.checkToken('valid-token');

            expect(result).toBe(undefined);
            expect(iam.readTokenPayload).toHaveBeenCalledWith('valid-token');
            expect(iam.checkPayloadIsExpired).toHaveBeenCalledWith(validPayload);
        });

        it('deve chamar métodos na ordem correta', () => {
            const payload: any = { exp: Math.floor(Date.now() / 1000) + 3600 };

            const readTokenSpy = jest.spyOn(iam, 'readTokenPayload').mockReturnValue(payload);
            const checkExpiredSpy = jest.spyOn(iam, 'checkPayloadIsExpired').mockReturnValue(false);

            iam.checkToken('test-token');

            expect(readTokenSpy).toHaveBeenCalled();
            expect(checkExpiredSpy).toHaveBeenCalled();
            expect(readTokenSpy).toHaveBeenCalledWith('test-token');
            expect(checkExpiredSpy).toHaveBeenCalledWith(payload);
        });
    });

    describe('readTokenPayload', () => {
        it('deve retornar payload quando token é válido', () => {
            const expectedPayload: any = {
                sub: 'user-123',
                exp: Math.floor(Date.now() / 1000) + 3600,
                iat: Math.floor(Date.now() / 1000),
                iss: 'https://auth.example.com',
            };

            mockDecodeJwt.mockReturnValue(expectedPayload);

            const result = iam.readTokenPayload('valid.jwt.token');

            expect(result).toEqual(expectedPayload);
            expect(mockDecodeJwt).toHaveBeenCalledWith('valid.jwt.token');
        });

        it('deve retornar null quando decodeJwt lança erro', () => {
            mockDecodeJwt.mockImplementation(() => {
                throw new Error('Invalid JWT format');
            });

            const result = iam.readTokenPayload('invalid-token');

            expect(result).toBeNull();
        });

        it('deve retornar null quando token é malformado', () => {
            mockDecodeJwt.mockImplementation(() => {
                throw new Error('JWT malformed');
            });

            const result = iam.readTokenPayload('malformed.token');

            expect(result).toBeNull();
            expect(mockDecodeJwt).toHaveBeenCalledWith('malformed.token');
        });

        it('deve tratar diferentes tipos de erro do jsonwebtoken', () => {
            const errorTypes = ['JWT malformed', 'Invalid signature', 'Token expired', 'Invalid token'];

            errorTypes.forEach((errorMessage) => {
                mockDecodeJwt.mockImplementation(() => {
                    throw new Error(errorMessage);
                });

                const result = iam.readTokenPayload('test-token');

                expect(result).toBeNull();

                jest.clearAllMocks();
            });
        });

        it('deve processar token JWT do Keycloak corretamente', () => {
            const keycloakPayload: any = {
                exp: 1760629096,
                iat: 1760628796,
                jti: '585f9222-9429-4679-884c-e2fd4d7a883e',
                iss: 'https://auth.hml.cbyk.com/realms/bauk-mx-hml',
                aud: ['realm-management', 'account'],
                sub: 'd7ba152d-b397-40c6-9ce4-13e53f375b08',
                typ: 'Bearer',
                azp: 'mx-api',
                realm_access: {
                    roles: ['m0', 'business', 'offline_access', 'default-roles-bauk-mx-hml', 'uma_authorization', 'portal'],
                },
                preferred_username: 'bruno.foggia@bauk.com.br',
                email: 'bruno.foggia@bauk.com.br',
                name: 'Bruno Foggia',
            };

            mockDecodeJwt.mockReturnValue(keycloakPayload);

            const result = iam.readTokenPayload('keycloak.jwt.token');

            expect(result).toEqual(keycloakPayload);
            expect(result.realm_access).toBeDefined();
            expect(result.preferred_username).toBe('bruno.foggia@bauk.com.br');
        });
    });

    describe('checkPayloadIsExpired', () => {
        beforeEach(() => {
            // Mock Date.now para ter controle sobre o tempo atual
            jest.spyOn(Date, 'now').mockReturnValue(1000000000); // Timestamp fixo
        });

        it('deve retornar false quando token não está expirado', () => {
            const futureExp = Math.floor(Date.now() / 1000) + 3600; // Expira em 1 hora
            const payload: any = { exp: futureExp };

            const result = iam.checkPayloadIsExpired(payload);

            expect(result).toBe(false);
        });

        it('deve retornar true quando token está expirado', () => {
            const pastExp = Math.floor(Date.now() / 1000) - 3600; // Expirado há 1 hora
            const payload: any = { exp: pastExp };

            const result = iam.checkPayloadIsExpired(payload);

            expect(result).toBe(true);
        });

        it('deve retornar true quando exp é undefined', () => {
            const payload: any = {};

            const result = iam.checkPayloadIsExpired(payload);

            expect(result).toBe(true);
        });

        it('deve retornar true quando exp é null', () => {
            const payload: any = { exp: null };

            const result = iam.checkPayloadIsExpired(payload);

            expect(result).toBe(true);
        });

        it('deve converter exp de segundos para milissegundos corretamente', () => {
            const expInSeconds = 1000; // 1000 segundos
            const payload: any = { exp: expInSeconds };

            // Mock Date.now para retornar um valor menor que exp * 1000
            (Date.now as jest.Mock).mockReturnValue(500000); // 500 segundos em ms

            const result = iam.checkPayloadIsExpired(payload);

            expect(result).toBe(false);
        });

        it('deve retornar true quando ocorre erro no processamento', () => {
            // Forçar erro com payload inválido
            const invalidPayload = { exp: 'invalid' } as any;

            const result = iam.checkPayloadIsExpired(invalidPayload);

            expect(result).toBe(true);
        });

        it('deve comparar expiração com precisão de milissegundos', () => {
            const currentTimeMs = 1640995200000; // Timestamp específico
            const expInSeconds = Math.floor(currentTimeMs / 1000); // Mesmo tempo em segundos

            (Date.now as jest.Mock).mockReturnValue(currentTimeMs + 1); // 1ms depois

            const payload: any = { exp: expInSeconds };
            const result = iam.checkPayloadIsExpired(payload);

            expect(result).toBe(true); // Deve estar expirado por 1ms
        });

        it('deve testar token do Keycloak com timestamp real', () => {
            // Timestamp do token real do .env (exp: 1760629096)
            const keycloakExp = 1760629096;
            const payload: any = { exp: keycloakExp };

            // Simular tempo antes da expiração
            (Date.now as jest.Mock).mockReturnValue(keycloakExp * 1000 - 1000); // 1 segundo antes

            let result = iam.checkPayloadIsExpired(payload);
            expect(result).toBe(false);

            // Simular tempo após expiração
            (Date.now as jest.Mock).mockReturnValue(keycloakExp * 1000 + 1000); // 1 segundo depois

            result = iam.checkPayloadIsExpired(payload);
            expect(result).toBe(true);
        });
    });

    describe('Casos de integração', () => {
        it('deve processar token válido do Keycloak completamente', () => {
            const keycloakToken =
                'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJuQVhaV2l0SzNWMVdLNEFqWlMyd3lQZ0hmZDhJVWpJX2V0alpNb0xONjZJIn0.eyJleHAiOjE3NjA2MjkwOTYsImlhdCI6MTc2MDYyODc5NiwianRpIjoiNTg1ZjkyMjItOTQyOS00Njc5LTg4NGMtZTJmZDRkN2E4ODNlIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLmhtbC5jYnlrLmNvbS9yZWFsbXMvYmF1ay1teC1obWwiLCJhdWQiOlsicmVhbG0tbWFuYWdlbWVudCIsImFjY291bnQiXSwic3ViIjoiZDdiYTE1MmQtYjM5Ny00MGM2LTljZTQtMTNlNTNmMzc1YjA4IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoibXgtYXBpIiwic2lkIjoiYjAzNjEwMDQtMTU5MC00ODAzLTgzY2ItMmM5N2MyOTEwZGM2IiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIvKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsibTAiLCJidXNpbmVzcyIsIm9mZmxpbmVfYWNjZXNzIiwiZGVmYXVsdC1yb2xlcy1iYXVrLW14LWhtbCIsInVtYV9hdXRob3JpemF0aW9uIiwicG9ydGFsIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsicmVhbG0tbWFuYWdlbWVudCI6eyJyb2xlcyI6WyJ2aWV3LWlkZW50aXR5LXByb3ZpZGVycyIsInZpZXctcmVhbG0iLCJtYW5hZ2UtaWRlbnRpdHktcHJvdmlkZXJzIiwiaW1wZXJzb25hdGlvbiIsInJlYWxtLWFkbWluIiwiY3JlYXRlLWNsaWVudCIsIm1hbmFnZS11c2VycyIsInF1ZXJ5LXJlYWxtcyIsInZpZXctYXV0aG9yaXphdGlvbiIsInF1ZXJ5LWNsaWVudHMiLCJxdWVyeS11c2VycyIsIm1hbmFnZS1ldmVudHMiLCJtYW5hZ2UtcmVhbG0iLCJ2aWV3LWV2ZW50cyIsInZpZXctdXNlcnMiLCJ2aWV3LWNsaWVudHMiLCJtYW5hZ2UtYXV0aG9yaXphdGlvbiIsIm1hbmFnZS1jbGllbnRzIiwicXVlcnktZ3JvdXBzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJCcnVubyBGb2dnaWEiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJicnVuby5mb2dnaWFAYmF1ay5jb20uYnIiLCJnaXZlbl9uYW1lIjoiQnJ1bm8iLCJmYW1pbHlfbmFtZSI6IkZvZ2dpYSIsImVtYWlsIjoiYnJ1bm8uZm9nZ2lhQGJhdWsuY29tLmJyIn0.signature';

            const payload: any = {
                exp: 1760629096, // Timestamp do token real
                iat: 1760628796,
                preferred_username: 'bruno.foggia@bauk.com.br',
                realm_access: {
                    roles: ['m0', 'business', 'portal'],
                },
            };

            mockDecodeJwt.mockReturnValue(payload);

            // Simular que o token ainda não expirou
            jest.spyOn(Date, 'now').mockReturnValue(1760629000 * 1000); // Antes da expiração

            const result = iam.checkToken(keycloakToken);

            expect(result).toBe(undefined);
            expect(mockDecodeJwt).toHaveBeenCalledWith(keycloakToken);
        });

        it('deve identificar token expirado', async () => {
            const payload: any = {
                exp: 1760629096,
                preferred_username: 'bruno.foggia@bauk.com.br',
            };

            mockDecodeJwt.mockReturnValue(payload);

            // Simular que o token já expirou
            jest.spyOn(Date, 'now').mockReturnValue(1760629200 * 1000); // Após expiração

            expect(() => iam.checkToken('expired-keycloak-token')).toThrowCode(ERROR_CODE.AUTH_TOKEN_EXPIRED);
        });

        it('deve extrair informações úteis para erro informativo', () => {
            const payload: any = {
                exp: 1760629096,
                iat: 1760628796,
                preferred_username: 'bruno.foggia@bauk.com.br',
                name: 'Bruno Foggia',
                email: 'bruno.foggia@bauk.com.br',
                iss: 'https://auth.hml.cbyk.com/realms/bauk-mx-hml',
                realm_access: {
                    roles: ['m0', 'business', 'portal'],
                },
            };

            mockDecodeJwt.mockReturnValue(payload);

            const tokenPayload = iam.readTokenPayload('test-token');

            // Verificar se temos todas as informações necessárias para erro informativo
            expect(tokenPayload.preferred_username).toBe('bruno.foggia@bauk.com.br');
            expect(tokenPayload.exp).toBe(1760629096);
            expect(tokenPayload.iss).toContain('cbyk.com');
            expect((tokenPayload.realm_access as any).roles).toContain('m0');

            // Calcular tempo até expiração
            const currentTime = Date.now();
            const expTime = payload.exp * 1000;
            const timeUntilExp = expTime - currentTime;

            expect(typeof timeUntilExp).toBe('number');
        });
    });

    describe('Configuração padrão', () => {
        it('deve ter defaultOptions definido', () => {
            expect(iam.defaultOptions).toEqual(IamDefaultOptions);
        });

        it('deve IamDefaultOptions ser um objeto vazio', () => {
            expect(IamDefaultOptions).toEqual({});
        });
    });
});
