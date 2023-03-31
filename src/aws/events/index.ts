import AWS from 'aws-sdk';
import _ from 'lodash';
import _debug from 'debug';
const debug = _debug('app:solutions:events');

import { sleep } from '../../common/utils/index.js';
import { EventsInterface } from '../../common/interfaces/events.interface.js';
import { Events } from '../../common/abstract/events.js';

export class SQS extends Events implements EventsInterface {
    public defaultOptions: any = {
        ...Events.prototype.defaultOptions,
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

    getInstance() {
        if (!this.instance) {
            this.instance = new AWS.SQS({
                ..._.pick(this.options, 'accessKeyId', 'secretAccessKey', 'region')
            });
        }
        return this.instance;
    }

    getSNSInstance() {
        if (!this.snsInstance) {
            this.snsInstance = new AWS.SNS({
                ..._.pick(this.options, 'accessKeyId', 'secretAccessKey', 'region')
            });
        }
        return this.snsInstance;
    }

    checkOptions() {
        if (!this.options.topicName) {
            throw new Error('topic name not specified for events (SNS/SQS)');
        }
        return true;
    }

    async initialize(options: any = {}) {
        this.setOptions(options);
        this.checkOptions();

        this.options.topicArn = await this.createTopic(this.options.topicName);
        this.options.loadQueues && (await this.options.loadQueues(this));
        // this._reconnecting = false;
    }

    async loadQueue(_name, _handler) {
        const events = this.getInstance();
        this.queueUrls[_name] = await this.createQueue(_name);
        await this.queueSubscribe(this.queueUrls[_name]);

        const params = {
            ...this.options.params,
            QueueUrl: this.queueUrls[_name],
        };

        events.receiveMessage(params, (err, data) => {
            if (err) {
                debug(err, err.stack);
            } else {
                this.receiveMessage(_name, _handler, data.Messages[0], { events: this });
            }
        });
    }

    async receiveMessage(name, handler, message, options) {
        const body = JSON.parse(message.content);
        debug(`@${process.pid} Executing Queue ${name}`);

        try {
            const result = await handler(body, {
                events: options.events,
                name
            });
            if (result !== false)
                return this.ack(name, message, options);
        } catch (error) {
            this.nack(name, message, options);
            debug(`@${process.pid} Error on Queue:`);
            debug(`Code: ${error.code}; Status: ${error.status}; Message: ${error.message}`);
            if (options.events.getOptions().throwError) {
                debug(`Trace:`);
                throw error;
            }
            return;
        }
        this.nack(name, message, options);
    }

    ack(name, message, options) {
        // Deleta a mensagem da fila
        const deleteParams = {
            QueueUrl: this.queueUrls[name],
            ReceiptHandle: message.ReceiptHandle
        };
        options.events.deleteMessage(deleteParams, function (error, data) {
            if (error) {
                debug(error, error.stack);
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

        options.events.changeMessageVisibility(changeParams, function (err, data) {
            if (err) {
                debug('Erro ao alterar visibilidade da mensagem: ', err);
            } else {
                debug('Visibilidade da mensagem alterada: ', message.MessageId);
            }
        });
    }

    createTopic(name) {
        return new Promise((resolve) => {
            const sns = this.getSNSInstance();
            sns.listTopics({}, (error, data) => {
                if (error) {
                    debug('Erro ao listar tópicos: ', error);
                    // reject(error);
                    this.createTopicOnFail(name)
                        .then((topicArn) => resolve(topicArn));
                } else {
                    let topicArn = '';
                    const topicExists = data.Topics.some((topic) => {
                        const found = topic.TopicArn.includes(name);
                        if (found) topicArn = topic.TopicArn;
                        return found;
                    });

                    if (!topicExists) {
                        sns.createTopic({ Name: name }, (error, data) => {
                            if (error) {
                                debug('Erro ao criar tópico: ', error);
                                // reject(error);
                                this.createTopicOnFail(name)
                                    .then((topicArn) => resolve(topicArn));
                            } else {
                                debug(`Tópico criado com sucesso: ${data.TopicArn}`);
                                resolve(data.TopicArn);
                            }
                        });
                    } else {
                        debug(`O tópico ${name} já existe`);
                        resolve(topicArn);
                    }

                }
            });
        });
    }

    async createTopicOnFail(name) {
        await sleep(this.options.retryInterval);
        return await this.createTopic(name);
    }

    createQueue(name) {
        return new Promise((resolve) => {
            // Verifica se a fila já existe
            const sqs = this.getInstance();
            sqs.listQueues({ QueueNamePrefix: name }, (error, data) => {
                if (error) {
                    debug(error);
                    // reject(error);
                    this.createQueueOnFail(name)
                        .then((queueUrl) => resolve(queueUrl));
                } else {
                    // Se a fila já existe, utiliza a URL da fila existente
                    if (data.QueueUrls && data.QueueUrls.length > 0) {
                        const queueUrl = data.QueueUrls[0];
                        debug(`A fila ${name} já existe (${queueUrl})`);
                        resolve(queueUrl);
                    } else {
                        // Se a fila não existe, cria uma nova fila
                        sqs.createQueue({ QueueName: name }, (error, data) => {
                            if (error) {
                                debug(error);
                                // reject(error);
                                this.createQueueOnFail(name)
                                    .then((queueUrl) => resolve(queueUrl));
                            } else {
                                const queueUrl = data.QueueUrl;
                                debug(`A fila ${name} foi criada com sucesso (${queueUrl})`);
                                resolve(queueUrl);
                            }
                        });
                    }
                }
            });
        });
    }

    async createQueueOnFail(name) {
        await sleep(this.options.retryInterval);
        return await this.createQueue(name);
    }

    queueSubscribe(queueUrl) {
        return new Promise((resolve) => {
            const sns = this.getSNSInstance();
            sns.subscribe({
                Protocol: 'sqs',
                TopicArn: this.options.topicArn,
                Endpoint: queueUrl
            }, (error, data) => {
                if (error) {
                    debug(error);
                    // reject(error);
                    this.queueSubscribeOnFail(queueUrl)
                        .then((value) => resolve(value));
                } else {
                    debug(`Fila inscrita no tópico ${this.options.topicArn}`);
                    resolve(true);
                }
            });
        });
    }

    async queueSubscribeOnFail(queueUrl) {
        await sleep(this.options.retryInterval);
        return await this.queueSubscribe(queueUrl);
    }
}