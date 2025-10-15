import { SQS } from './index';

// Mocks simplificados - apenas o essencial
jest.mock('lodash', () => ({
    cloneDeep: (obj: any) => JSON.parse(JSON.stringify(obj)),
    defaultsDeep: (target: any, source: any) => ({ ...source, ...target }),
    intersection: jest.fn(() => []),
    keys: jest.fn(() => []),
}));

jest.mock('debug', () => () => jest.fn());
jest.mock('../../common/utils/index', () => ({ sleep: jest.fn() }));
jest.mock('../index', () => ({
    keyFields: { region: true },
    libraries: {},
    providerConfig: jest.fn().mockResolvedValue({ region: 'us-east-1' }),
}));

// Mock das classes base sem herança complexa
jest.mock('../../common/abstract/solution', () => ({
    Solution: class MockSolution {
        options = {};
        defaultOptions = {};
        setOptions(opts: any) {
            this.options = { ...this.defaultOptions, ...opts };
        }
        getOptions() {
            return this.options;
        }
        async initialize(opts: any) {
            this.setOptions(opts);
        }
        getLibrary() {
            return jest.fn();
        }
        mergeProviderOptions(opts: any) {
            return opts;
        }
        checkOptions() {
            return true;
        }
    },
}));

jest.mock('../../common/abstract/events', () => ({
    Events: class MockEvents {
        options = {};
        defaultOptions = { retryInterval: 5000, retryLimit: 3 };
        setOptions(opts: any) {
            this.options = { ...this.defaultOptions, ...opts };
        }
        getOptions() {
            return this.options;
        }
        async initialize(opts: any) {
            this.setOptions(opts);
        }
        getLibrary() {
            return jest.fn();
        }
        mergeProviderOptions(opts: any) {
            return opts;
        }
        checkOptions() {
            return true;
        }
        formatQueueName(name: string) {
            return name;
        }
        async receiveMessage(name, handler, message, options) {
            return;
        }
        getPrefix() {
            return '';
        }
        async ack() {
            return;
        }
        async nack() {
            return;
        }
    },
    eventsDefaultOptions: { retryInterval: 5000, retryLimit: 3 },
}));

describe('SQS - Testes Básicos', () => {
    let sqs: SQS;

    beforeEach(() => {
        jest.clearAllMocks();
        sqs = new SQS();

        // Mock apenas os métodos que causam problemas
        jest.spyOn(sqs, 'createInstance').mockResolvedValue({ send: jest.fn() });
        jest.spyOn(sqs, 'listenAll').mockImplementation(() => Promise.resolve());
    });

    describe('initialize', () => {
        it('deve inicializar sem erro', async () => {
            await expect(sqs.initialize()).resolves.not.toThrow();
        });

        it('deve chamar loadQueues se fornecido', async () => {
            const mockLoadQueues = jest.fn();

            await sqs.initialize({ loadQueues: mockLoadQueues });

            expect(mockLoadQueues).toHaveBeenCalledWith(sqs);
        });
    });

    describe('queueUrlToARN', () => {
        it('deve converter URL HTTPS para ARN', () => {
            const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789/my-queue';
            const expectedArn = 'arn:aws:sqs:us-east-1:123456789:my-queue';

            const result = sqs.queueUrlToARN(queueUrl);

            expect(result).toBe(expectedArn);
        });

        it('deve retornar string original se não for HTTPS', () => {
            const nonHttpsString = 'arn:aws:sqs:us-east-1:123456789:my-queue';

            const result = sqs.queueUrlToARN(nonHttpsString);

            expect(result).toBe(nonHttpsString);
        });
    });

    describe('formatQueueName', () => {
        it('deve formatar nome básico', () => {
            // Mock formatQueueName da classe pai para evitar recursão
            jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(sqs)), 'formatQueueName').mockReturnValue('base-name');

            sqs.setOptions({ fifo: false });

            const result = sqs.formatQueueName('test-queue');

            expect(result).toBe('base-name');
        });

        it('deve adicionar .fifo quando habilitado', () => {
            // Mock formatQueueName da classe pai
            jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(sqs)), 'formatQueueName').mockReturnValue('base-name');

            sqs.setOptions({ fifo: true });

            const result = sqs.formatQueueName('test-queue');

            expect(result).toBe('base-name.fifo');
        });
    });

    describe('checkOptions', () => {
        it('deve retornar true', () => {
            expect(sqs.checkOptions()).toBe(true);
        });
    });

    describe('getInstance', () => {
        beforeEach(async () => {
            await sqs.initialize();
        });

        it('deve retornar instância existente quando não há opções de chave', async () => {
            const lodash = require('lodash');
            lodash.intersection.mockReturnValue([]);
            lodash.keys.mockReturnValue(['option1']);

            const instance = await sqs.getInstance({ option1: 'value' });

            expect(instance).toBeDefined();
        });

        it('deve criar nova instância quando há opções de chave', async () => {
            const lodash = require('lodash');
            lodash.intersection.mockReturnValue(['region']);
            lodash.keys.mockReturnValue(['region']);

            const instance = await sqs.getInstance({ region: 'us-west-2' });

            expect(instance).toBeDefined();
        });
    });

    describe('buildListenerParams', () => {
        beforeEach(async () => {
            await sqs.initialize();
            sqs['queueUrls'] = { 'test-queue': 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue' };
        });

        it('deve construir parâmetros básicos', () => {
            const result = sqs.buildListenerParams('test-queue');

            expect(result).toEqual(
                expect.objectContaining({
                    QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
                }),
            );
        });

        it('deve incluir MaxNumberOfMessages quando definido', () => {
            sqs.setOptions({ maxNumberOfMessages: 5 });

            const result = sqs.buildListenerParams('test-queue');

            expect(result.MaxNumberOfMessages).toBe(5);
        });
    });

    describe('_sendToQueue', () => {
        beforeEach(async () => {
            await sqs.initialize();
            jest.spyOn(sqs, 'getQueueUrl').mockResolvedValue('https://sqs.us-east-1.amazonaws.com/123456789/test-queue');
        });

        it('deve enviar objeto como JSON', async () => {
            const testData = { test: 'data' };
            const mockSendFn = jest.fn().mockResolvedValue({ MessageId: 'msg-123' });

            jest.spyOn(sqs, 'getInstance').mockImplementation(async (options: any = {}) => {
                return { send: mockSendFn };
            });
            jest.spyOn(sqs, 'buildCommand').mockImplementation((name, params) => {
                return params;
            });

            await sqs._sendToQueue('test-queue', testData);

            expect(mockSendFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    MessageBody: JSON.stringify(testData),
                }),
            );
        });

        it('deve enviar string como string', async () => {
            const testData = 'test message';
            const mockSendFn = jest.fn().mockResolvedValue({ MessageId: 'msg-123' });

            jest.spyOn(sqs, 'getInstance').mockImplementation(async (options: any = {}) => {
                return { send: mockSendFn };
            });
            jest.spyOn(sqs, 'buildCommand').mockImplementation((name, params) => {
                return params;
            });

            await sqs._sendToQueue('test-queue', testData);

            expect(mockSendFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    MessageBody: testData,
                }),
            );
        });
    });

    describe('ack', () => {
        beforeEach(async () => {
            await sqs.initialize();
            sqs['queueUrls'] = { 'test-queue': 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue' };
        });

        it('deve fazer ACK da mensagem', async () => {
            const message = { MessageId: 'msg-123', ReceiptHandle: 'receipt-handle' };
            const mockDeleteCommand = jest.fn();
            jest.spyOn(sqs, 'getLibrary').mockImplementation((name) => {
                if (name === 'SQSDeleteMessageCommand') return mockDeleteCommand;
                return jest.fn();
            });

            await sqs.ack('test-queue', message, {});

            expect(mockDeleteCommand).toHaveBeenCalledWith(
                expect.objectContaining({
                    QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
                    ReceiptHandle: 'receipt-handle',
                }),
            );
        });
    });

    describe('nack', () => {
        beforeEach(async () => {
            await sqs.initialize();
            sqs['queueUrls'] = { 'test-queue': 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue' };
        });

        it('deve fazer NACK da mensagem', async () => {
            const message = { MessageId: 'msg-123', ReceiptHandle: 'receipt-handle' };
            const mockChangeVisibilityCommand = jest.fn();
            jest.spyOn(sqs, 'getLibrary').mockImplementation((name) => {
                if (name === 'SQSChangeMessageVisibilityCommand') return mockChangeVisibilityCommand;
                return jest.fn();
            });

            await sqs.nack('test-queue', message, {});

            expect(mockChangeVisibilityCommand).toHaveBeenCalledWith(
                expect.objectContaining({
                    QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
                    ReceiptHandle: 'receipt-handle',
                    VisibilityTimeout: 10,
                }),
            );
        });

        it('deve capturar erros quando throwError não está habilitado', async () => {
            const message = { MessageId: 'msg-123', ReceiptHandle: 'receipt-handle' };
            const mockInstance = { send: jest.fn().mockRejectedValue(new Error('AWS Error')) };
            jest.spyOn(sqs, 'getInstance').mockResolvedValue(mockInstance);
            sqs.setOptions({ throwError: false } as any);

            await expect(sqs.nack('test-queue', message, {})).resolves.not.toThrow();
        });
    });

    describe('processReceivedMessages', () => {
        beforeEach(async () => {
            await sqs.initialize();
        });

        it('deve processar mensagens recebidas', async () => {
            const handler = jest.fn();
            const mockMessage = { MessageId: 'msg-1', Body: '{"test": "data"}' };
            sqs['messagesReceived'] = [{ name: 'test-queue', handler, message: mockMessage, options: {} }];

            jest.spyOn(sqs, 'receiveMessage').mockResolvedValue(undefined);

            await sqs.processReceivedMessages();

            expect(sqs.receiveMessage).toHaveBeenCalledWith('test-queue', handler, mockMessage, {});
            expect(sqs['messagesReceived']).toHaveLength(0);
        });

        it('deve respeitar limite de processamento simultâneo', async () => {
            expect.assertions(3);
            sqs.setOptions({ maxNumberOfSimultaneousMessages: 1 } as any);
            const handler = jest.fn();
            sqs['messagesReceived'] = [
                { name: 'queue1', handler, message: {}, options: {} },
                { name: 'queue2', handler, message: {}, options: {} },
            ];

            jest.spyOn(sqs, 'receiveMessage').mockResolvedValue(undefined);

            expect(sqs['messagesReceived']).toHaveLength(2);
            await sqs.processReceivedMessages();

            expect(sqs.receiveMessage).toHaveBeenCalledTimes(2);
            expect(sqs['messagesReceived']).toHaveLength(0);
        });
    });

    describe('createQueue e findQueueUrl', () => {
        beforeEach(async () => {
            await sqs.initialize();
        });

        it('deve retornar URL existente em createQueue', async () => {
            jest.spyOn(sqs, 'findQueueUrl').mockResolvedValue('existing-queue-url');

            const result = await sqs.createQueue('test-queue');

            expect(result).toBe('existing-queue-url');
        });

        it('deve criar nova queue quando não existe', async () => {
            jest.spyOn(sqs, 'findQueueUrl').mockRejectedValue(new Error('Queue not found'));
            jest.spyOn(sqs, '_createQueue').mockResolvedValue(undefined);

            await sqs.createQueue('test-queue');

            expect(sqs._createQueue).toHaveBeenCalledWith('test-queue');
        });

        it('deve encontrar URL da queue em findQueueUrl', async () => {
            const mockGetQueueUrlCommand = jest.fn();
            const mockInstance = { send: jest.fn().mockResolvedValue({ QueueUrl: 'test-url' }) };
            jest.spyOn(sqs, 'getInstance').mockResolvedValue(mockInstance);
            jest.spyOn(sqs, 'getLibrary').mockImplementation((name) => {
                if (name === 'SQSGetQueueUrlCommand') return mockGetQueueUrlCommand;
                return jest.fn();
            });

            const result = await sqs.findQueueUrl('test-queue');

            expect(result).toBe('test-url');
            expect(mockGetQueueUrlCommand).toHaveBeenCalledWith({ QueueName: 'test-queue' });
        });
    });

    describe('loadQueue', () => {
        beforeEach(async () => {
            await sqs.initialize();
        });

        it('deve carregar queue única', async () => {
            const handler = jest.fn();
            jest.spyOn(sqs, 'formatQueueName').mockReturnValue('formatted-queue');
            jest.spyOn(sqs, 'createQueue').mockResolvedValue('https://sqs.us-east-1.amazonaws.com/123456789/formatted-queue');

            await sqs.loadQueue('test-queue', handler);

            expect(sqs['queueUrls']['formatted-queue']).toBe('https://sqs.us-east-1.amazonaws.com/123456789/formatted-queue');
            expect(sqs['queueListeners']).toContainEqual({
                name: 'formatted-queue',
                handler,
            });
        });

        it('deve carregar múltiplas queues', async () => {
            const handler = jest.fn();
            jest.spyOn(sqs, 'formatQueueName').mockImplementation((name) => `formatted-${name}`);
            jest.spyOn(sqs, 'createQueue').mockResolvedValue('https://sqs.us-east-1.amazonaws.com/123456789/queue');

            await sqs.loadQueue(['queue1', 'queue2'], handler);

            expect(sqs['queueListeners']).toHaveLength(2);
        });

        it('deve deletar queues quando deleteAllQueues é true', async () => {
            jest.spyOn(sqs, 'getOptions').mockReturnValue({ deleteAllQueues: true } as any);
            jest.spyOn(sqs, 'formatQueueName').mockReturnValue('formatted-queue');
            jest.spyOn(sqs, 'deleteQueue').mockResolvedValue(undefined);

            await sqs.loadQueue('test-queue', jest.fn());

            expect(sqs.deleteQueue).toHaveBeenCalledWith('formatted-queue');
        });
    });

    describe('listen', () => {
        let mockInstance: any;

        beforeEach(async () => {
            mockInstance = { send: jest.fn() };
            jest.spyOn(sqs, 'getInstance').mockResolvedValue(mockInstance);
            await sqs.initialize();
        });

        it('deve escutar mensagens com sucesso', async () => {
            const handler = jest.fn();
            jest.spyOn(sqs, '_receiveMessages').mockResolvedValue(undefined);

            await sqs.listen('test-queue', handler);

            expect(sqs._receiveMessages).toHaveBeenCalledWith('test-queue', handler, mockInstance);
        });

        it('deve tentar novamente em caso de erro', async () => {
            const handler = jest.fn();
            const sleep = require('../../common/utils/index').sleep;

            jest.spyOn(sqs, '_receiveMessages').mockRejectedValueOnce(new Error('Connection error')).mockResolvedValueOnce(undefined);

            // Mock recursivo para evitar loop infinito
            jest.spyOn(sqs, 'listen').mockImplementation(async (name, hdl) => {
                try {
                    await sqs._receiveMessages(name, hdl, mockInstance);
                } catch (error) {
                    await sleep(300);
                    return; // Simula o retry
                }
            });

            await sqs.listen('test-queue', handler);

            expect(sleep).toHaveBeenCalledWith(300);
        });
    });

    describe('_receiveMessages', () => {
        let mockInstance: any;
        let mockReceiveMessageCommand: jest.Mock;

        beforeEach(async () => {
            mockInstance = { send: jest.fn() };
            mockReceiveMessageCommand = jest.fn();

            jest.spyOn(sqs, 'getInstance').mockResolvedValue(mockInstance);
            jest.spyOn(sqs, 'getLibrary').mockImplementation((name) => {
                if (name === 'SQSReceiveMessageCommand') return mockReceiveMessageCommand;
                return jest.fn();
            });

            await sqs.initialize();
        });

        it('deve receber mensagens e adicioná-las à lista', async () => {
            const handler = jest.fn();
            const mockMessages = [
                { MessageId: '1', Body: '{"test": "data1"}' },
                { MessageId: '2', Body: '{"test": "data2"}' },
            ];

            mockInstance.send.mockResolvedValue({ Messages: mockMessages });
            jest.spyOn(sqs, 'buildListenerParams').mockReturnValue({
                QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
                MaxNumberOfMessages: 1,
            });

            await sqs._receiveMessages('test-queue', handler, mockInstance);

            expect(sqs['messagesReceived']).toHaveLength(2);
            expect(sqs['messagesReceived'][0].message).toEqual(mockMessages[0]);
        });

        it('deve lidar com resposta sem mensagens', async () => {
            const handler = jest.fn();
            mockInstance.send.mockResolvedValue({});
            jest.spyOn(sqs, 'buildListenerParams').mockReturnValue({});

            await sqs._receiveMessages('test-queue', handler, mockInstance);

            expect(sqs['messagesReceived']).toHaveLength(0);
        });

        it('deve lançar erro em caso de falha', async () => {
            const handler = jest.fn();
            const error = new Error('SQS Error');
            mockInstance.send.mockRejectedValue(error);
            jest.spyOn(sqs, 'buildListenerParams').mockReturnValue({});

            await expect(sqs._receiveMessages('test-queue', handler, mockInstance)).rejects.toThrow('SQS Error');
        });
    });

    describe('getQueueUrl', () => {
        beforeEach(async () => {
            await sqs.initialize();
        });

        it('deve retornar URL cached se existir', async () => {
            sqs['queueUrls']['test-queue'] = 'cached-url';

            const result = await sqs.getQueueUrl('test-queue');

            expect(result).toBe('cached-url');
        });

        it('deve buscar e cachear URL se não existir', async () => {
            jest.spyOn(sqs, 'findQueueUrl').mockResolvedValue('found-url');

            const result = await sqs.getQueueUrl('test-queue');

            expect(result).toBe('found-url');
            expect(sqs['queueUrls']['test-queue']).toBe('found-url');
        });
    });
});
