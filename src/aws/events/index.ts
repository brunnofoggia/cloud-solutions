import AWS from 'aws-sdk';
import _ from 'lodash';
import _debug from 'debug';
const debug = _debug('solutions:events');

import { sleep } from '../../common/utils/index.js';
import { EventsInterface } from '../../common/interfaces/events.interface.js';
import { Events } from '../../common/abstract/events.js';
import { keyFields, providerConfig } from '../index.js';

export class SQS extends Events implements EventsInterface {
    public defaultOptions: any = {
        ...Events.prototype.defaultOptions,
        listenInterval: 1000,
        params: {
            AttributeNames: ['All'],
            MaxNumberOfMessages: 1,
            VisibilityTimeout: 120, // em segundos
            WaitTimeSeconds: 0,
        },
    };
    protected queueUrls: any = {};
    protected instance;
    protected snsInstance;

    async initialize(options: any = {}) {
        super.initialize(options);
        this.checkOptions();

        this.instance = this.createInstance(options);
        this.snsInstance = this.createSNSInstance(options);

        this.options.topicArn = await this.createTopic(this.options.topicName);
        this.options.loadQueues && (await this.options.loadQueues(this));
        // this._reconnecting = false;
    }

    getInstance(options: any = {}) {
        if (_.intersection(_.keys(options), _.keys(keyFields)).length > 0) {
            const instance = this.createInstance(options);
            providerConfig(_.pick(this.providerOptions, ..._.keys(keyFields)));
            return instance;
        }
        return this.instance;
    }

    createInstance(options: any = {}) {
        providerConfig(_.defaults(
            _.pick(options, ..._.keys(keyFields)),
            _.pick(this.providerOptions, ..._.keys(keyFields)),
        ));

        const instance = new AWS.SQS({});

        return instance;
    }

    getSNSInstance(options: any = {}) {
        if (_.intersection(_.keys(options), _.keys(keyFields)).length > 0) {
            const instance = this.createSNSInstance(options);
            providerConfig(_.pick(this.providerOptions, ..._.keys(keyFields)));
            return instance;
        }
        return this.snsInstance;
    }

    createSNSInstance(options: any = {}) {
        providerConfig(_.defaults(
            _.pick(options, ..._.keys(keyFields)),
            _.pick(this.providerOptions, ..._.keys(keyFields)),
        ));

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
            this.listener(name, _handler);
        }
    }

    async listener(_name, _handler) {
        const sqs = this.getInstance();

        const params = {
            ...this.options.params,
            QueueUrl: this.queueUrls[_name],
        };

        sqs.receiveMessage(params, (error, data) => {
            if (error) {
                debug('loadQueue:receiveMessage', error.message);
                if (this.options.throwError)
                    throw error;
            }
            else {
                if (data?.Messages?.length)
                    for (const index in data.Messages)
                        this.receiveMessage(_name, _handler, data.Messages[index], { events: this });
            }
        });
        await sleep(this.options.listenInterval);
        this.listener(_name, _handler);
    }

    _sendToQueue(_name, data) {
        const name = this.formatQueueName(_name);
        return new Promise((resolve, reject) => {
            this.getQueueUrl(name).then((queueUrl) => {
                const params = {
                    MessageBody: typeof data === 'object' ? JSON.stringify(data) : data + '',
                    QueueUrl: queueUrl
                };

                const sqs = this.getInstance();
                sqs.sendMessage(params, (error, data) => {
                    if (error) {
                        debug('_sendToQueue:', 'Erro ao enviar mensagem para a fila:', error.message);
                        if (this.options.throwError)
                            throw error;
                    } else {
                        debug('_sendToQueue:', 'Mensagem enviada com sucesso:', data.MessageId);
                        resolve(true);
                    }
                });
            });
        });
    }

    ack(name, message, options) {
        // Deleta a mensagem da fila
        const deleteParams = {
            QueueUrl: this.queueUrls[name],
            ReceiptHandle: message.ReceiptHandle
        };

        const sqs = this.getInstance();
        sqs.deleteMessage(deleteParams, (error, data) => {
            if (error) {
                debug('ack:', error.message);
                if (this.options.throwError)
                    throw error;
            } else {
                debug(`Mensagem ${message.MessageId} deletada da fila`);
            }
        });
    }

    nack(name, message, options) {
        // debug('Erro ao processar mensagem: ', err);
        // Diminui o tempo de visibilidade da mensagem para que ela seja reprocessada
        const changeParams = {
            QueueUrl: this.queueUrls[name],
            ReceiptHandle: message.ReceiptHandle,
            VisibilityTimeout: 0,
        };

        const sqs = this.getInstance();
        sqs.changeMessageVisibility(changeParams, (error, data) => {
            if (error) {
                debug('Erro ao alterar visibilidade da mensagem: ', error.message);
                if (this.options.throwError)
                    throw error;
            }
            // else {
            // debug('Visibilidade da mensagem alterada: ', message.MessageId);
            // }
        });
    }

    createTopic(name) {
        return new Promise((resolve) => {
            const sns = this.getSNSInstance();
            this.findTopic(name).then((topicArn) => {
                if (topicArn) {
                    // debug(`A fila ${name} já existe (${queueUrl})`);
                    resolve(topicArn);
                } else {
                    sns.createTopic({ Name: name }, (error, data) => {
                        if (error) {
                            debug('Erro ao criar tópico: ', error.message);
                            if (this.options.throwError)
                                throw error;
                            // reject(error);
                            this.createTopicOnFail(name)
                                .then((topicArn) => resolve(topicArn));
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
        return await this.createTopic(name);
    }

    findTopic(name) {
        return new Promise((resolve, reject) => {
            const sns = this.getSNSInstance();
            sns.listTopics({}, (error, data) => {
                if (error) {
                    debug('Erro ao listar tópicos: ', error.message);
                    if (this.options.throwError)
                        throw error;
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

    createQueue(name) {
        return new Promise((resolve) => {
            // Verifica se a fila já existe
            const sqs = this.getInstance();
            this.findQueueUrl(name).then((queueUrl) => {
                if (queueUrl) {
                    // debug(`A fila ${name} já existe (${queueUrl})`);
                    resolve(queueUrl);
                } else {
                    // Se a fila não existe, cria uma nova fila
                    sqs.createQueue({ QueueName: name }, (error, data) => {
                        if (error) {
                            debug('createQueue:', error.message);
                            if (this.options.throwError)
                                throw error;
                            // reject(error);
                            this.createQueueOnFail(name)
                                .then((queueUrl) => resolve(queueUrl));
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
        if (!this.queueUrls[name])
            this.queueUrls[name] = await this.findQueueUrl(name);
        return this.queueUrls[name];
    }

    findQueueUrl(name) {
        return new Promise((resolve, reject) => {
            // Verifica se a fila já existe
            const sqs = this.getInstance();
            sqs.listQueues({ QueueNamePrefix: name }, (error, data) => {
                if (error) {
                    debug('findQueueUrl:', error.message);
                    if (this.options.throwError)
                        throw error;
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

    queueSubscribe(_queueUrl) {
        return new Promise((resolve, reject) => {
            const queueUrl = this.queueUrlToARN(_queueUrl);
            const sns = this.getSNSInstance();
            sns.subscribe({
                Protocol: 'sqs',
                TopicArn: this.options.topicArn,
                Endpoint: queueUrl
            }, (error, data) => {
                if (error) {
                    debug('queueSubscribe:', error.message);
                    if (this.options.throwError)
                        throw error;
                    reject();
                } else {
                    // debug(`Fila inscrita no tópico ${this.options.topicArn}`);
                    resolve(true);
                }
            });
        });
    }
}