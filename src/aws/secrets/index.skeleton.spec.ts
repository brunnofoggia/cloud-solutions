import { ParameterStore } from './index';

// Mock das dependências externas
jest.mock('lodash', () => ({
    intersection: jest.fn(),
    keys: jest.fn(),
    omitBy: jest.fn((obj: any) => obj),
    isUndefined: jest.fn(),
    isEmpty: jest.fn(),
    merge: jest.fn((target: any, source: any) => ({ ...target, ...source })),
    defaultsDeep: jest.fn((target: any, source: any) => ({ ...source, ...target })),
    cloneDeep: jest.fn((obj: any) => obj),
}));

// Mock da classe base Secrets
jest.mock('../../common/abstract/secrets', () => {
    return {
        Secrets: class MockSecrets {
            async initialize() {
                /* mock */
            }
            getLibrary(name: string) {
                if (name === 'SSMClient') return jest.fn();
                if (name === 'SSMGetParameterCommand') return jest.fn();
                return jest.fn();
            }
            mergeProviderOptions(options: any) {
                return options;
            }
            getOptions() {
                return { WithDecryption: true };
            }
        },
    };
});

jest.mock('../index', () => ({
    keyFields: ['region', 'accessKeyId', 'secretAccessKey'],
    libraries: {
        SSMClient: jest.fn(),
        SSMGetParameterCommand: jest.fn(),
    },
    providerConfig: jest.fn(),
}));

describe('ParameterStore', () => {
    let parameterStore: ParameterStore;
    let mockSSMClient: jest.Mock;
    let mockSSMGetParameterCommand: jest.Mock;
    let mockProviderConfig: jest.Mock;
    let mockIntersection: jest.Mock;
    let mockKeys: jest.Mock;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup mocks
        mockSSMClient = jest.fn();
        mockSSMGetParameterCommand = jest.fn();
        mockProviderConfig = jest.fn();
        mockIntersection = require('lodash').intersection as jest.Mock;
        mockKeys = require('lodash').keys as jest.Mock;

        const { libraries, providerConfig } = require('../index');
        libraries.SSMClient = mockSSMClient;
        libraries.SSMGetParameterCommand = mockSSMGetParameterCommand;
        Object.assign(require('../index'), { providerConfig: mockProviderConfig });

        // Setup default mock return values
        (mockProviderConfig as any).mockResolvedValue({ region: 'us-east-1' });

        parameterStore = new ParameterStore();

        // Mock métodos da classe base que podem estar sendo chamados
        jest.spyOn(parameterStore, 'getLibrary').mockImplementation((name: string) => {
            if (name === 'SSMClient') return mockSSMClient;
            if (name === 'SSMGetParameterCommand') return mockSSMGetParameterCommand;
            return jest.fn();
        });

        jest.spyOn(parameterStore, 'mergeProviderOptions').mockImplementation((options: any) => options);
        jest.spyOn(parameterStore, 'getOptions').mockReturnValue({ WithDecryption: true });
    });

    describe('initialize', () => {
        it('deve inicializar com opções padrão', async () => {
            const mockInstance = { send: jest.fn() };
            mockSSMClient.mockReturnValue(mockInstance);

            await parameterStore.initialize();

            expect(mockProviderConfig).toHaveBeenCalled();
            expect(mockSSMClient).toHaveBeenCalledWith({ region: 'us-east-1' });
            expect(parameterStore['instance']).toBe(mockInstance);
        });

        it('deve inicializar com opções customizadas', async () => {
            const options = { region: 'sa-east-1', customOption: 'value' };
            const mockInstance = { send: jest.fn() };
            mockSSMClient.mockReturnValue(mockInstance);

            await parameterStore.initialize(options);

            expect(mockProviderConfig).toHaveBeenCalledWith(expect.objectContaining(options));
        });
    });

    describe('getInstance', () => {
        beforeEach(async () => {
            const mockInstance = { send: jest.fn() };
            mockSSMClient.mockReturnValue(mockInstance);
            await parameterStore.initialize();
        });

        it('deve retornar instância existente quando não há opções de chave', async () => {
            mockIntersection.mockReturnValue([]);
            mockKeys.mockReturnValue(['option1', 'option2']);

            const instance = await parameterStore.getInstance({ option1: 'value' });

            expect(instance).toBe(parameterStore['instance']);
            expect(mockIntersection).toHaveBeenCalled();
        });

        it('deve criar nova instância quando há opções de chave', async () => {
            mockIntersection.mockReturnValue(['region']);
            mockKeys.mockReturnValue(['region']);

            const newMockInstance = { send: jest.fn() };
            mockSSMClient.mockReturnValue(newMockInstance);

            const instance = await parameterStore.getInstance({ region: 'us-west-2' });

            expect(instance).toBe(newMockInstance);
            expect(instance).not.toBe(parameterStore['instance']);
        });
    });

    describe('createInstance', () => {
        it('deve criar instância SSMClient com configuração correta', async () => {
            const options = { region: 'eu-west-1' };
            const mockConfig = { region: 'eu-west-1' };
            const mockInstance = { send: jest.fn() };

            (mockProviderConfig as any).mockResolvedValue(mockConfig);
            mockSSMClient.mockReturnValue(mockInstance);

            const instance = await parameterStore.createInstance(options);

            expect(mockProviderConfig).toHaveBeenCalledWith(expect.objectContaining(options));
            expect(mockSSMClient).toHaveBeenCalledWith(mockConfig);
            expect(instance).toBe(mockInstance);
        });
    });

    describe('_getSecretValue', () => {
        beforeEach(async () => {
            const mockInstance = { send: jest.fn() };
            mockSSMClient.mockReturnValue(mockInstance);
            await parameterStore.initialize();
        });

        it('deve retornar valor do parâmetro quando encontrado', async () => {
            const mockParam = {
                Value: 'secret-value',
                ARN: 'arn:aws:ssm:us-east-1:123456789:parameter/test',
            };

            jest.spyOn(parameterStore, 'getParameterFromCloud').mockResolvedValue(mockParam);

            const result = await parameterStore._getSecretValue('/test/path');

            expect(result).toBe('secret-value');
            expect(parameterStore.getParameterFromCloud).toHaveBeenCalledWith('/test/path');
        });

        it('deve lançar erro quando parâmetro não encontrado', async () => {
            jest.spyOn(parameterStore, 'getParameterFromCloud').mockResolvedValue(null);

            await expect(parameterStore._getSecretValue('/test/path')).rejects.toThrow('secret not found "/test/path"');
        });

        it('deve lançar erro quando parâmetro não tem Value', async () => {
            const mockParam = {
                ARN: 'arn:aws:ssm:us-east-1:123456789:parameter/test',
            };

            jest.spyOn(parameterStore, 'getParameterFromCloud').mockResolvedValue(mockParam);

            await expect(parameterStore._getSecretValue('/test/path')).rejects.toThrow('secret not found "/test/path"');
        });

        it('deve lançar erro quando parâmetro não tem ARN', async () => {
            const mockParam = {
                Value: 'secret-value',
            };

            jest.spyOn(parameterStore, 'getParameterFromCloud').mockResolvedValue(mockParam);

            await expect(parameterStore._getSecretValue('/test/path')).rejects.toThrow('secret not found "/test/path"');
        });
    });

    describe('request', () => {
        let mockInstance: any;

        beforeEach(async () => {
            mockInstance = { send: jest.fn() };
            mockSSMClient.mockReturnValue(mockInstance);
            await parameterStore.initialize();
        });

        it('deve fazer request usando a instância SSM', async () => {
            const mockCommand = { Name: 'test', WithDecryption: true };
            const mockResponse = { Parameter: { Value: 'test-value' } };

            mockInstance.send.mockResolvedValue(mockResponse);

            const result = await parameterStore.request(mockCommand);

            expect(mockInstance.send).toHaveBeenCalledWith(mockCommand);
            expect(result).toBe(mockResponse);
        });

        it('deve propagar erros da instância SSM', async () => {
            const mockCommand = { Name: 'test' };
            const error = new Error('SSM Error');

            mockInstance.send.mockRejectedValue(error);

            await expect(parameterStore.request(mockCommand)).rejects.toThrow('SSM Error');
        });
    });

    describe('_buildCommand', () => {
        beforeEach(async () => {
            const mockInstance = { send: jest.fn() };
            mockSSMClient.mockReturnValue(mockInstance);
            await parameterStore.initialize();
        });

        it('deve criar comando GetParameter com opções corretas', () => {
            const mockCommand = { Name: 'test', WithDecryption: true };
            mockSSMGetParameterCommand.mockReturnValue(mockCommand);

            jest.spyOn(parameterStore, 'getOptions').mockReturnValue({ WithDecryption: true });

            const result = parameterStore._buildCommand('/test/parameter');

            expect(mockSSMGetParameterCommand).toHaveBeenCalledWith({
                Name: '/test/parameter',
                WithDecryption: true,
            });
            expect(result).toBe(mockCommand);
        });

        it('deve usar WithDecryption das opções', () => {
            mockSSMGetParameterCommand.mockReturnValue({});
            jest.spyOn(parameterStore, 'getOptions').mockReturnValue({ WithDecryption: false });

            parameterStore._buildCommand('/test/parameter');

            expect(mockSSMGetParameterCommand).toHaveBeenCalledWith({
                Name: '/test/parameter',
                WithDecryption: false,
            });
        });
    });

    describe('getParameterFromCloud', () => {
        let mockInstance: any;

        beforeEach(async () => {
            mockInstance = { send: jest.fn() };
            mockSSMClient.mockReturnValue(mockInstance);
            await parameterStore.initialize();
        });

        it('deve retornar parâmetro quando request é bem-sucedido', async () => {
            const mockParameter = {
                Value: 'parameter-value',
                ARN: 'arn:aws:ssm:us-east-1:123456789:parameter/test',
            };
            const mockResponse = { Parameter: mockParameter };

            mockInstance.send.mockResolvedValue(mockResponse);
            const mockCommand = { Name: 'test' };
            jest.spyOn(parameterStore, '_buildCommand').mockReturnValue(mockCommand);

            const result = await parameterStore.getParameterFromCloud('/test/parameter');

            expect(parameterStore._buildCommand).toHaveBeenCalledWith('/test/parameter');
            expect(mockInstance.send).toHaveBeenCalledWith(mockCommand);
            expect(result).toBe(mockParameter);
        });

        it('deve adicionar nome do parâmetro à mensagem de erro', async () => {
            const originalError = new Error('Parameter not found');
            mockInstance.send.mockRejectedValue(originalError);

            const mockCommand = { Name: 'test' };
            jest.spyOn(parameterStore, '_buildCommand').mockReturnValue(mockCommand);

            await expect(parameterStore.getParameterFromCloud('/test/parameter')).rejects.toThrow('"/test/parameter": Parameter not found');
        });

        it('deve preservar o erro original com contexto do parâmetro', async () => {
            const originalError = new Error('Access denied');
            mockInstance.send.mockRejectedValue(originalError);

            jest.spyOn(parameterStore, '_buildCommand').mockReturnValue({});

            try {
                await parameterStore.getParameterFromCloud('/secret/key');
            } catch (error) {
                expect(error.message).toBe('"/secret/key": Access denied');
            }
        });
    });

    describe('defaultOptions', () => {
        it('deve ter opções padrão corretas', () => {
            expect(parameterStore.defaultOptions).toEqual({
                cache: true,
                WithDecryption: true,
            });
        });
    });

    describe('integração entre métodos', () => {
        it('deve funcionar o fluxo completo de obter um secret', async () => {
            const mockInstance = { send: jest.fn() };
            const mockParameter = {
                Value: 'my-secret-value',
                ARN: 'arn:aws:ssm:us-east-1:123456789:parameter/app/secret',
            };
            const mockResponse = { Parameter: mockParameter };
            const mockCommand = { Name: '/app/secret', WithDecryption: true };

            mockSSMClient.mockReturnValue(mockInstance);
            mockSSMGetParameterCommand.mockReturnValue(mockCommand);
            (mockInstance.send as any).mockResolvedValue(mockResponse);

            await parameterStore.initialize();
            jest.spyOn(parameterStore, 'getOptions').mockReturnValue({ WithDecryption: true });

            const result = await parameterStore._getSecretValue('/app/secret');

            expect(result).toBe('my-secret-value');
            expect(mockSSMGetParameterCommand).toHaveBeenCalledWith({
                Name: '/app/secret',
                WithDecryption: true,
            });
            expect(mockInstance.send).toHaveBeenCalledWith(mockCommand);
        });
    });
});
