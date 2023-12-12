import _ from 'lodash';
import _debug from 'debug';
const debug = _debug('solutions:events');

import { sleep } from '../../common/utils/index';
import { EventsInterface } from '../../common/interfaces/events.interface';
import { Events } from '../../common/abstract/events';
import { keyFields, libraries, providerConfig } from '../index';

let AWS;

export class SQS extends Events implements EventsInterface {
    protected libraries = libraries;
    public defaultOptions: any = {
        ...Events.prototype.defaultOptions,
        processMessagesAtOnce: 0,
        processingMessages: 0,
        listenInterval: 1000,
        params: {
            AttributeNames: ['All'],
            VisibilityTimeout: 120, // em segundos
            WaitTimeSeconds: 0,
        },
    };
    protected queueUrls: any = {};
    protected instance;
    protected snsInstance;
    protected listeners = [];

    async initialize(options: any = {}) {
        await super.initialize(options);
        AWS = this.getLibrary('AWS');
        this.checkOptions();

        this.instance = await this.createInstance(options);
        this.snsInstance = await this.createSNSInstance(options);

        this.options.topicName && (this.options.topicArn = await this.createSNSTopic(this.options.topicName));
        if (this.options.loadQueues) {
            await this.options.loadQueues(this);
            this.listenAll();
        }
        // this._reconnecting = false;
    }

    async getInstance(options: any = {}) {
        if (_.intersection(_.keys(options), _.keys(keyFields)).length > 0) {
            const instance = await this.createInstance(options);
            await providerConfig(_.pick(this.providerOptions, ..._.keys(keyFields)));
            return instance;
        }
        return this.instance;
    }

    async createInstance(options: any = {}) {
        await providerConfig(_.defaults(_.pick(options, ..._.keys(keyFields)), _.pick(this.providerOptions, ..._.keys(keyFields))));

        const instance = new AWS.SQS({});

        return instance;
    }

    async getSNSInstance(options: any = {}) {
        if (_.intersection(_.keys(options), _.keys(keyFields)).length > 0) {
            const instance = await this.createSNSInstance(options);
            await providerConfig(_.pick(this.providerOptions, ..._.keys(keyFields)));
            return instance;
        }
        return this.snsInstance;
    }

    async createSNSInstance(options: any = {}) {
        await providerConfig(_.defaults(_.pick(options, ..._.keys(keyFields)), _.pick(this.providerOptions, ..._.keys(keyFields))));

        const instance = new AWS.SNS({});

        return instance;
    }

    checkOptions() {
        if (!this.options.topicName) {
            throw new Error('topic name not specified for events (SNS/SQS)');
        }
        return true;
    }

    async loadQueue(_name, _handler) {
        const names = typeof _name === 'string' ? [_name] : _name;
        for (const _name of names) {
            const name = this.formatQueueName(_name);
            this.queueUrls[name] = await this.createQueue(name);
            debug('loadQueue:queueUrl', this.queueUrls[name]);

            await this.queueSubscribe(this.queueUrls[name]);
            this.listeners.push([name, _handler]);
        }
    }

    buildListenerParams(_name) {
        const params: any = {
            ...this.options.params,
            QueueUrl: this.queueUrls[_name],
        };

        const max = +this.options.maxNumberOfMessages;
        const current = this.options.processingMessages;
        const available = max - current;
        if (this.options.maxNumberOfMessages) params.MaxNumberOfMessages = available;

        return params;
    }

    lengthAvailable() {
        const max = +this.options.maxNumberOfMessages;
        const current = this.options.processingMessages;
        const available = max - current;
        return available;
    }

    async listenAll() {
        for (const [name, handler] of this.listeners) {
            if (this.lengthAvailable() <= 0) break;

            try {
                await this.listen(name, handler);
            } catch (err) {
                debug('err found listening to:', name, 'error:', err);
            }
        }

        return setTimeout(() => this.listenAll(), this.options.listenInterval);
    }

    async listen(_name, _handler) {
        const sqs = await this.getInstance();
        return new Promise<void>((resolve, reject) => {
            const params = this.buildListenerParams(_name);

            sqs.receiveMessage(params, (error, data) => {
                if (error) {
                    debug('loadQueue:receiveMessage', error.message);
                    if (this.options.throwError) return reject(error);
                } else {
                    if (data?.Messages?.length) {
                        this.options.processingMessages += data?.Messages?.length || 0;
                        if (this.options.processMessagesAtOnce) this.receiveMessage(_name, _handler, data.Messages, { events: this });
                        else for (const index in data.Messages) this.receiveMessage(_name, _handler, data.Messages[index], { events: this });
                    }
                }
                return resolve();
            });
        });
    }

    _sendToQueue(_name, data) {
        const name = this.formatQueueName(_name);
        return new Promise((resolve) => {
            this.getQueueUrl(name).then(async (queueUrl) => {
                const params = {
                    MessageBody: typeof data === 'object' ? JSON.stringify(data) : data + '',
                    QueueUrl: queueUrl,
                };

                const sqs = await this.getInstance();
                sqs.sendMessage(params, (error, data) => {
                    if (error) {
                        debug('_sendToQueue:', 'Erro ao enviar mensagem para a fila:', error.message);
                        if (this.options.throwError) throw error;
                    } else {
                        debug('_sendToQueue:', 'Mensagem enviada com sucesso:', data.MessageId);
                        resolve(true);
                    }
                });
            });
        });
    }

    async ack(name, message, options) {
        const messages = !this.options.processMessagesAtOnce ? [message] : message;
        this.options.processingMessages -= message.length;
        await this.deleteMessages(name, messages);
    }

    async deleteMessages(name, messages) {
        for (const message of messages) {
            await this.deleteMessage(name, message);
        }
    }

    async deleteMessage(name, message) {
        const sqs = await this.getInstance();

        const deleteParams = {
            QueueUrl: this.queueUrls[name],
            ReceiptHandle: message.ReceiptHandle,
        };
        sqs.deleteMessage(deleteParams, (error, data) => {
            if (error) {
                debug('ack:', error.message);
                if (this.options.throwError) throw error;
            } else {
                debug(`Mensagem ${message.MessageId} deletada da fila`);
            }
        });
    }

    async nack(name, message, options) {
        const messages = !this.options.processMessagesAtOnce ? [message] : message;
        this.options.processingMessages -= message.length;
        await this.changeMessagesVisibility(name, messages);
    }

    async changeMessagesVisibility(name, messages) {
        for (const message of messages) {
            await this.changeMessageVisibility(name, message);
        }
    }

    async changeMessageVisibility(name, message) {
        const sqs = await this.getInstance();
        // Diminui o tempo de visibilidade da mensagem para que ela seja reprocessada
        const changeParams = {
            QueueUrl: this.queueUrls[name],
            ReceiptHandle: message.ReceiptHandle,
            VisibilityTimeout: 0,
        };
        sqs.changeMessageVisibility(changeParams, (error, data) => {
            if (error) {
                debug('Erro ao alterar visibilidade da mensagem: ', error.message);
                if (this.options.throwError) throw error;
            }
            // else {
            // debug('Visibilidade da mensagem alterada: ', message.MessageId);
            // }
        });
    }

    async createSNSTopic(name) {
        const sns = await this.getSNSInstance();
        return new Promise((resolve) => {
            this.findTopic(name).then((topicArn) => {
                if (topicArn) {
                    // debug(`A fila ${name} já existe (${queueUrl})`);
                    resolve(topicArn);
                } else {
                    sns.createTopic({ Name: name }, (error, data) => {
                        if (error) {
                            debug('Erro ao criar tópico: ', error.message);
                            if (this.options.throwError) throw error;
                            // reject(error);
                            this.createTopicOnFail(name).then((topicArn) => resolve(topicArn));
                        } else {
                            // debug(`Tópico criado com sucesso: ${data.TopicArn}`);
                            resolve(data.TopicArn);
                        }
                    });
                }
            });
        });
    }

    async createTopicOnFail(name) {
        await sleep(this.options.retryInterval);
        return await this.createSNSTopic(name);
    }

    async findTopic(name) {
        const sns = await this.getSNSInstance();
        return new Promise((resolve, reject) => {
            sns.listTopics({}, (error, data) => {
                if (error) {
                    debug('Erro ao listar tópicos: ', error.message);
                    if (this.options.throwError) throw error;
                    // reject(error);
                    reject();
                } else {
                    let topicArn = '';
                    data.Topics.some((topic) => {
                        const found = topic.TopicArn.includes(name);
                        if (found) topicArn = topic.TopicArn;
                        return found;
                    });
                    resolve(topicArn);
                }
            });
        });
    }

    async createQueue(name) {
        const sqs = await this.getInstance();
        return new Promise((resolve) => {
            // Verifica se a fila já existe
            this.findQueueUrl(name).then((queueUrl) => {
                if (queueUrl) {
                    // debug(`A fila ${name} já existe (${queueUrl})`);
                    resolve(queueUrl);
                } else {
                    // Se a fila não existe, cria uma nova fila
                    sqs.createQueue({ QueueName: name }, (error, data) => {
                        if (error) {
                            debug('createQueue:', error.message);
                            if (this.options.throwError) throw error;
                            // reject(error);
                            this.createQueueOnFail(name).then((queueUrl) => resolve(queueUrl));
                        } else {
                            const queueUrl = data.QueueUrl;
                            // debug(`A fila ${name} foi criada com sucesso (${queueUrl})`);
                            resolve(queueUrl);
                        }
                    });
                }
            });
        });
    }

    async createQueueOnFail(name) {
        await sleep(this.options.retryInterval);
        return await this.createQueue(name);
    }

    async getQueueUrl(name) {
        if (!this.queueUrls[name]) this.queueUrls[name] = await this.findQueueUrl(name);
        return this.queueUrls[name];
    }

    async findQueueUrl(name) {
        const sqs = await this.getInstance();
        return new Promise((resolve, reject) => {
            // Verifica se a fila já existe
            sqs.listQueues({ QueueNamePrefix: name }, (error, data) => {
                if (error) {
                    debug('findQueueUrl:', error.message);
                    if (this.options.throwError) throw error;
                    reject();
                } else {
                    // Se a fila já existe, utiliza a URL da fila existente
                    if (data.QueueUrls && data.QueueUrls.length > 0) {
                        const queueUrl = data.QueueUrls[0];
                        resolve(queueUrl);
                    } else {
                        resolve('');
                    }
                }
            });
        });
    }

    queueUrlToARN(_queueUrl) {
        if (/https/.test(_queueUrl)) {
            return _queueUrl.replace(/^(https:\/\/)(\w+)\.([\w-]+)\.([\w.]+)\/(\w+)\/([\w-]+)$/, 'arn:aws:$2:$3:$5:$6');
        }
        return _queueUrl;
    }

    async queueSubscribe(_queueUrl) {
        const sns = await this.getSNSInstance();
        return new Promise((resolve, reject) => {
            const queueUrl = this.queueUrlToARN(_queueUrl);
            sns.subscribe(
                {
                    Protocol: 'sqs',
                    TopicArn: this.options.topicArn,
                    Endpoint: queueUrl,
                },
                (error, data) => {
                    if (error) {
                        debug('queueSubscribe:', error.message);
                        if (this.options.throwError) throw error;
                        reject();
                    } else {
                        // debug(`Fila inscrita no tópico ${this.options.topicArn}`);
                        resolve(true);
                    }
                },
            );
        });
    }
}
