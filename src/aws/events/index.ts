import { cloneDeep, defaults, defaultsDeep, intersection, keys, omit, pick } from 'lodash';
import _debug from 'debug';
const debug = _debug('solutions:events');
const log = _debug('solutions:essential:events');

import { sleep } from '../../common/utils/index';
import { EventsInterface } from '../../common/interfaces/events.interface';
import { Events, eventsDefaultOptions } from '../../common/abstract/events';
import { keyFields, libraries, providerConfig } from '../index';

// let AWS;

export const sqsDefaultOptions = defaultsDeep(
    {
        listenInterval: 300,
        processInterval: 300,
        fifo: false,
        deleteAllQueues: false,
        TopicAttributes: {},
        SubscribeAttributes: {},
        QueueAttributes: {},
        SendMessageAttributes: {},
        params: {
            AttributeNames: ['All'],
            VisibilityTimeout: 120, // em segundos
            WaitTimeSeconds: 0,
        },
    },
    eventsDefaultOptions,
);
export class SQS extends Events implements EventsInterface {
    protected libraries = libraries;
    public defaultOptions: any = cloneDeep(sqsDefaultOptions);
    protected queueUrls: any = {};
    protected instance;
    protected queueListeners = [];
    protected messagesReceived = [];
    protected messageSlots = 0;
    protected isProcessingMessage = false;

    async initialize(options: any = {}) {
        await super.initialize(options);
        this.checkOptions();

        this.instance = await this.createInstance(this.options);
        this.options.loadQueues && (await this.options.loadQueues(this));
        if (this.getOptions().deleteAllQueues) throw new Error('All queues deleted');

        this.listenAll();
    }

    setOptions(options?: any): void {
        super.setOptions(options);

        if (this.options.fifo) {
            const prefix = this.getPrefix(options);

            this.options.topicName += '.fifo';
            this.options.QueueAttributes.FifoQueue = 'true';
            this.options.QueueAttributes.ContentBasedDeduplication = 'true';

            this.options.TopicAttributes.FifoTopic = 'true';
            this.options.TopicAttributes.ContentBasedDeduplication = 'true';
            // this.options.TopicAttributes.SqsMessageGroupId = 'abc';

            // this.options.SubscribeAttributes.MessageGroupId = this.options.topicName;
            this.options.SendMessageAttributes.MessageGroupId = prefix;
        }
    }

    async getInstance(options: any = {}) {
        if (intersection(keys(options), keys(keyFields)).length > 0) {
            const instance = await this.createInstance(options);
            return instance;
        }
        return this.instance;
    }

    async createInstance(options: any = {}) {
        const SQSClient = this.getLibrary('SQSClient');

        const _options = this.mergeProviderOptions(options, keyFields);
        const config = await providerConfig(_options);
        const instance = new SQSClient(config);

        return instance;
    }

    formatQueueName(name, options: any = {}) {
        let _name = super.formatQueueName(name, options);
        if (this.options.fifo) _name += '.fifo';
        return _name;
    }

    async processReceivedMessages() {
        this.isProcessingMessage = false;
        this.messageSlots = this.getOptions().maxNumberOfMessages;
        const promises = [];
        if (this.messagesReceived.length) {
            this.isProcessingMessage = true;
            let message = null;
            while ((message = this.messagesReceived.shift())) {
                promises.push(this.receiveMessage(message.name, message.handler, message.message, message.options));
                this.messageSlots--;
                if (!this.messageSlots) break;
            }
        }

        if (promises.length) {
            await Promise.all(promises);
            this.isProcessingMessage = false;
        }

        if (this.messagesReceived.length) this.processReceivedMessages();
        else this.listenAll();
    }

    checkOptions() {
        return true;
    }

    async loadQueue(_name, _handler) {
        const names = typeof _name === 'string' ? [_name] : _name;
        const deleteAllQueues = this.getOptions().deleteAllQueues;
        for (const _name of names) {
            const name = this.formatQueueName(_name);
            if (deleteAllQueues) {
                await this.deleteQueue(name);
                continue;
            }
            this.queueUrls[name] = await this.createQueue(name);
            debug('loadQueue:queueUrl', name, this.queueUrls[name]);

            this.queueListeners.push({ name, handler: _handler });
        }
    }

    async listenAll() {
        await sleep(this.options.listenInterval);
        if (this.queueListeners.length)
            for (const listen of this.queueListeners) {
                await this.listen(listen.name, listen.handler);
            }

        this.processReceivedMessages();
    }

    buildListenerParams(_name) {
        const params: any = {
            ...this.options.params,
            QueueUrl: this.queueUrls[_name],
        };

        if (this.options.maxNumberOfMessages) params.MaxNumberOfMessages = +this.options.maxNumberOfMessages;

        return params;
    }

    async listen(_name, _handler) {
        try {
            const sqs = await this.getInstance();
            await this._receiveMessages(_name, _handler, sqs);
        } catch (error) {
            log('listen:', error.message);
            await sleep(this.options.listenInterval);
            return this.listen(_name, _handler);
        }
    }

    async _receiveMessages(_name, _handler, instance) {
        const ReceiveMessageCommand = this.getLibrary('SQSReceiveMessageCommand');
        const params = this.buildListenerParams(_name);

        try {
            const command = new ReceiveMessageCommand(params);
            const data = await instance.send(command);

            if (data.Messages?.length) {
                for (const message of data.Messages) {
                    this.messagesReceived.push({
                        name: _name,
                        handler: _handler,
                        options: { events: this },
                        message,
                    });
                }
            }
        } catch (error) {
            log('loadQueue:receiveMessage', error.message);
            throw error;
        }
    }

    async _sendToQueue(_name, data, options: any = {}) {
        const instance = await this.getInstance(options);
        const SendMessageCommand = this.getLibrary('SQSSendMessageCommand');

        const name = this.formatQueueName(_name, options);
        const queueUrl = await this.getQueueUrl(name);
        const params = {
            MessageBody: typeof data === 'object' ? JSON.stringify(data) : data + '',
            QueueUrl: queueUrl,
            ...this.options.SendMessageAttributes,
        };
        const command = new SendMessageCommand(params);

        try {
            const data = await instance.send(command);
            debug('Mensagem enviada com sucesso:', name, data.MessageId);
        } catch (error) {
            debug('Erro ao enviar mensagem:', error.message);
            throw error;
        }
    }

    async ack(name, message, options) {
        const sqsClient = await this.getInstance();
        const DeleteMessageCommand = this.getLibrary('SQSDeleteMessageCommand');

        const deleteParams = {
            QueueUrl: this.queueUrls[name],
            ReceiptHandle: message.ReceiptHandle,
        };

        const command = new DeleteMessageCommand(deleteParams);
        await sqsClient.send(command);
        debug('Mensagem excluída com sucesso:', message.MessageId);
    }

    async nack(name, message, options) {
        const instance = await this.getInstance();
        const ChangeMessageVisibilityCommand = this.getLibrary('SQSChangeMessageVisibilityCommand');

        const changeParams = {
            QueueUrl: this.queueUrls[name],
            ReceiptHandle: message.ReceiptHandle,
            VisibilityTimeout: 10,
        };

        try {
            const command = new ChangeMessageVisibilityCommand(changeParams);
            await instance.send(command);
        } catch (error) {
            debug('Erro ao alterar visibilidade da mensagem:', error.message);
            if (this.options.throwError) throw error;
        }
    }

    async _createQueue(name) {
        const instance = await this.getInstance();
        const CreateQueueCommand = this.getLibrary('SQSCreateQueueCommand');
        const Attributes = this.getOptions().QueueAttributes || {};
        /*
        {
            // Aqui você pode definir atributos opcionais da fila, como:
            // DelaySeconds: "0", // Atraso em segundos para mensagens
            // MaxMessageSize: "262144", // Tamanho máximo da mensagem em bytes
            // MessageRetentionPeriod: "345600", // Tempo de retenção em segundos
            // VisibilityTimeout: "30", // Tempo de visibilidade em segundos
            // ReceiveMessageWaitTimeSeconds: "0" // Tempo de espera para receber mensagens
        }
        */

        const params = {
            QueueName: name,
            Attributes,
        };

        const command = new CreateQueueCommand(params);

        try {
            const data = await instance.send(command);
            debug(`A fila ${name} foi criada com sucesso (${data.QueueUrl})`);
        } catch (error) {
            log('createQueue:', error.message);
            throw error;
        }
    }

    async deleteQueue(name) {
        const instante = await this.getInstance();
        const DeleteQueueCommand = this.getLibrary('SQSDeleteQueueCommand');
        const queueUrl = await this.findQueueUrl(name);

        const params = {
            QueueUrl: queueUrl,
        };

        try {
            const data = await instante.send(new DeleteQueueCommand(params));
            log(`A fila ${name} foi deletada com sucesso. data? ${JSON.stringify(data)}.`);
        } catch (error) {
            log(`falha ao excluir a fila ${name}: ${error.message}`);
            throw error;
        }
    }

    async createQueue(name, options: any = {}) {
        try {
            return await this.findQueueUrl(name);
        } catch (error) {
            return await this._createQueue(name);
        }
    }

    async createQueueOnFail(name) {
        await sleep(this.options.retryInterval);
        return await this.createQueue(name);
    }

    async getQueueUrl(name) {
        if (!this.queueUrls[name]) {
            this.queueUrls[name] = await this.findQueueUrl(name);
        }
        return this.queueUrls[name];
    }

    async findQueueUrl(name) {
        const sqsClient = await this.getInstance();
        const GetQueueUrlCommand = this.getLibrary('SQSGetQueueUrlCommand');
        const params = {
            QueueName: name,
        };

        try {
            const data = await sqsClient.send(new GetQueueUrlCommand(params));
            // console.log(`URL da fila "${name}":`, data.QueueUrl);
            return data.QueueUrl;
        } catch (error) {
            debug(`Erro ao obter a URL da fila "${name}"`, error.message);
            throw error;
        }
    }

    queueUrlToARN(_queueUrl) {
        if (/https/.test(_queueUrl)) {
            const arn = _queueUrl.replace(/^(https:\/\/)(\w+)\.([\w-]+)\.([\w.]+)\/(\w+)\/([\w-.]+)$/, 'arn:aws:$2:$3:$5:$6');
            return arn;
        }
        return _queueUrl;
    }
}
