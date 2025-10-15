import { Err, buildErrorCode, ERROR_CODE_TYPE } from './error';
import { ERROR_CODE, errorPrefix } from '../../enum/error';

// Mock do lodash
jest.mock('lodash', () => ({
    indexOf: jest.fn(),
}));

describe('Error Utils', () => {
    let mockIndexOf: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        const lodash = require('lodash');
        mockIndexOf = lodash.indexOf;
    });

    describe('buildErrorCode', () => {
        it('deve converter string numérica para string', () => {
            const result = buildErrorCode('123');
            expect(result).toBe('123');
        });

        it('deve construir código de erro com número válido', () => {
            // Mock indexOf para retornar posição válida (encontrou o código)
            mockIndexOf.mockReturnValue(0);

            const result = buildErrorCode(404);

            expect(mockIndexOf).toHaveBeenCalledWith(Object.values(ERROR_CODE), 404);
            expect(result).toBe(`${errorPrefix}-404`);
        });

        it('deve construir código de erro com número válido em posição diferente', () => {
            // Mock indexOf para retornar posição válida diferente de 0
            mockIndexOf.mockReturnValue(2);

            const result = buildErrorCode(500);

            expect(mockIndexOf).toHaveBeenCalledWith(Object.values(ERROR_CODE), 500);
            expect(result).toBe(`${errorPrefix}-500`);
        });

        it('deve retornar string quando número não está nos ERROR_CODE', () => {
            // Mock indexOf para retornar -1 (não encontrou)
            mockIndexOf.mockReturnValue(-1);

            const result = buildErrorCode(999);

            expect(mockIndexOf).toHaveBeenCalledWith(Object.values(ERROR_CODE), 999);
            expect(result).toBe('999');
        });

        it('deve retornar string quando parâmetro já é string', () => {
            mockIndexOf.mockReturnValue(-1);
            const result = buildErrorCode('CUSTOM_ERROR');

            // indexOf não deve ser chamado quando é string
            expect(result).toBe('CUSTOM_ERROR');
        });

        it('deve lidar com código 0', () => {
            mockIndexOf.mockReturnValue(0);

            const result = buildErrorCode(0);

            expect(result).toBe(`${errorPrefix}-0`);
        });

        it('deve lidar com string vazia', () => {
            const result = buildErrorCode('');

            expect(result).toBe(`${errorPrefix}-0`);
        });
    });

    describe('Err Class', () => {
        describe('Construção da classe', () => {
            it('deve criar erro com mensagem e código padrão', () => {
                mockIndexOf.mockReturnValue(0);

                const error = new Err('Test error message');

                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(Err);
                expect(error.message).toBe('Test error message');
                expect(error.code).toBe(`${errorPrefix}-${ERROR_CODE.UNKNOWN}`);
            });

            it('deve criar erro com mensagem e código específico', () => {
                mockIndexOf.mockReturnValue(1);
                const customCode = ERROR_CODE.UNKNOWN; // Usa código válido do enum

                const error = new Err('Validation failed', customCode);

                expect(error.message).toBe('Validation failed');
                expect(error.code).toBe(`${errorPrefix}-${customCode}`);
                expect(mockIndexOf).toHaveBeenCalledWith(Object.values(ERROR_CODE), customCode);
            });

            it('deve criar erro com código customizado como string', () => {
                mockIndexOf.mockReturnValue(-1);
                const error = new Err('Custom error', 'CUSTOM_CODE');

                expect(error.message).toBe('Custom error');
                expect(error.code).toBe('CUSTOM_CODE');
            });

            it('deve manter propriedades da classe Error', () => {
                const error = new Err('Test error');

                expect(error.name).toBe('Error');
                expect(error.stack).toBeDefined();
                expect(typeof error.stack).toBe('string');
            });
        });

        describe('Comportamento com diferentes códigos de erro', () => {
            it('deve usar código válido do enum ERROR_CODE', () => {
                mockIndexOf.mockReturnValue(0);

                // Assume que ERROR_CODE tem pelo menos um valor
                const firstErrorCode = Object.values(ERROR_CODE)[0];
                const error = new Err('Error with enum code', firstErrorCode);

                expect(error.code).toBe(`${errorPrefix}-${firstErrorCode}`);
            });

            it('deve lidar com código não encontrado no enum', () => {
                mockIndexOf.mockReturnValue(-1);

                const error = new Err('Error with invalid code', 9999 as ERROR_CODE_TYPE);

                expect(error.code).toBe('9999');
            });

            it('deve usar ERROR_CODE.UNKNOWN quando não especificado', () => {
                mockIndexOf.mockReturnValue(0);

                const error = new Err('Default error');

                expect(mockIndexOf).toHaveBeenCalledWith(Object.values(ERROR_CODE), ERROR_CODE.UNKNOWN);
                expect(error.code).toContain(ERROR_CODE.UNKNOWN.toString());
            });
        });

        describe('Herança e instanceof', () => {
            it('deve ser instanceof Error', () => {
                const error = new Err('Test');

                expect(error instanceof Error).toBe(true);
                expect(error instanceof Err).toBe(true);
            });

            it('deve ter prototype correto', () => {
                const error = new Err('Test');

                expect(Object.getPrototypeOf(error)).toBe(Err.prototype);
                expect(Object.getPrototypeOf(Object.getPrototypeOf(error))).toBe(Error.prototype);
            });

            it('deve ser detectado em try/catch como Error', () => {
                expect(() => {
                    throw new Err('Test error');
                }).toThrow(Error);

                expect(() => {
                    throw new Err('Test error');
                }).toThrow(Err);
            });
        });

        describe('Casos especiais', () => {
            it('deve lidar com mensagem vazia', () => {
                const error = new Err('');

                expect(error.message).toBe('');
                expect(error.code).toBeDefined();
            });

            it('deve lidar com mensagem null/undefined', () => {
                const error1 = new Err(null as any);
                const error2 = new Err(undefined as any);

                expect(error1.message).toBe('null');
                expect(error2.message).toBe('undefined');
            });

            it('deve manter referência do errorPrefix', () => {
                mockIndexOf.mockReturnValue(0);

                const error = new Err('Test', 123 as ERROR_CODE_TYPE);

                expect(error.code).toContain(errorPrefix);
            });

            it('deve ser serializável para JSON', () => {
                mockIndexOf.mockReturnValue(-1);
                const error = new Err('Serializable error', 'TEST_CODE');

                const serialized = JSON.stringify({
                    message: error.message,
                    code: error.code,
                    name: error.name,
                });

                const parsed = JSON.parse(serialized);

                expect(parsed.message).toBe('Serializable error');
                expect(parsed.code).toBe('TEST_CODE');
                expect(parsed.name).toBe('Error');
            });
        });

        describe('Integração com diferentes ERROR_CODE', () => {
            it('deve funcionar com todos os valores do enum ERROR_CODE', () => {
                const errorCodes = Object.values(ERROR_CODE);

                errorCodes.forEach((code, index) => {
                    mockIndexOf.mockReturnValue(index);

                    const error = new Err(`Error for code ${code}`, code);

                    expect(error.code).toBe(`${errorPrefix}-${code}`);
                    expect(error.message).toBe(`Error for code ${code}`);
                });
            });

            it('deve manter consistência de tipos', () => {
                const error = new Err('Type test');

                expect(typeof error.message).toBe('string');
                expect(typeof error.code).toBe('string');
                expect(typeof error.name).toBe('string');
            });
        });
    });

    describe('Integração buildErrorCode e Err', () => {
        it('deve usar buildErrorCode internamente na classe Err', () => {
            mockIndexOf.mockReturnValue(0);

            const testCode = 400;
            const error = new Err('Integration test', testCode as ERROR_CODE_TYPE);

            // Verifica se o resultado é consistente entre as duas funções
            const directBuild = buildErrorCode(testCode);

            expect(error.code).toBe(directBuild);
        });

        it('deve tratar códigos de erro de forma consistente', () => {
            const testCases = [
                { input: 404, shouldFind: true, expectedIndex: 0 },
                { input: 'CUSTOM', shouldFind: false, expectedIndex: null },
                { input: 0, shouldFind: true, expectedIndex: 0 },
            ];

            testCases.forEach(({ input, shouldFind, expectedIndex }) => {
                if (shouldFind && expectedIndex !== null) {
                    mockIndexOf.mockReturnValue(expectedIndex);
                } else {
                    mockIndexOf.mockReturnValue(-1);
                }

                const error = new Err('Consistency test', input as ERROR_CODE_TYPE);
                const direct = buildErrorCode(input);

                expect(error.code).toBe(direct);
            });
        });

        describe('ERROR_CODE enum coverage', () => {
            it('deve lidar com valores nulos/indefinidos', () => {
                expect.assertions(2);
                const code = buildErrorCode(null);
                expect(code).toBe(`${errorPrefix}-${ERROR_CODE.UNKNOWN}`);
                const code2 = buildErrorCode(undefined);
                expect(code2).toBe(`${errorPrefix}-${ERROR_CODE.UNKNOWN}`);
            });
        });
    });
});
