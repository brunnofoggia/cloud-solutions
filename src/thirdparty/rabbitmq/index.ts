import _debug from 'debug';
const debug = _debug('solutions:events');

import { sleep } from '../../common/utils/index';
import { EventsInterface } from '../../common/interfaces/events.interface';
import { Events } from '../../common/abstract/events';

let amqplib;
export class RabbitMQ extends Events implements EventsInterface {
    protected libraries = {
        amqplib: 'amqplib',
    };
    private connection = null;
    private channel = null;
    private _reconnecting = false;

    async initialize(options: any = {}) {
        await super.initialize(options);
        amqplib = this.getLibrary('amqplib');
        this.options.isConsumer = options.isConsumer || true;

        await this.connect();
        await this.createChannel();
        this.options.loadQueues && (await this.options.loadQueues(this));
        this._reconnecting = false;
    }

    private async connect() {
        try {
            const host = this.options.host || 'localhost';
            const port = this.options.port || '5672';
            const user = this.options.user || 'guest';
            const pass = this.options.pass || 'guest';

            this.connection = await amqplib.connect(`amqp://${user}:${pass}@${host}:${port}`);

            this.connection.once('close', async () => {
                debug(`@${process.pid} RABBITMQ CONNECTION CLOSED. RETRYING TO RECONNECT...`);
                await this.reconnect();
            });
        } catch (error) {
            return await this.connectOnFail(error);
        }

        if (this.options.isConsumer) {
            debug(`@${process.pid} CONNECTED ON RABBITMQ!`);
        }

        return this.connection;
    }

    private async connectOnFail(error) {
        if (this.options.isConsumer) {
            debug(`@${process.pid} UNABLE TO CONNECT ON RABBITMQ! ${error?.message || ''}`);
            debug(`@${process.pid} RETRYING TO CONNECT ON RABBITMQ...`);
        }
        await sleep(this.options.retryInterval);
        return await this.connect();
    }

    private async createChannel() {
        try {
            this.channel = await this.connection.createChannel();
            if (this.options.maxNumberOfMessages) {
                // this.channel.prefetch(+this.options.maxNumberOfMessages);
                this.channel.qos(+this.options.maxNumberOfMessages, true);
            }

            this.channel.once('close', async () => {
                debug(`@${process.pid} RABBITMQ CHANNEL CLOSED. RETRYING TO CREATE CHANNEL ON RABBITMQ... ${new Date()}`);
                this.reconnect();
            });
            this.channel.on('error', async (error) => {
                debug(`@${process.pid} RABBITMQ CHANNEL ERROR. ${error.message || ''}`);
            });
        } catch (error) {
            return await this.createChannelOnFail(error);
        }

        if (this.options.isConsumer) {
            debug(`@${process.pid} CHANNEL ON RABBITMQ CREATED!`);
        }

        return this.channel;
    }

    private async createChannelOnFail(error) {
        if (this.options.isConsumer) {
            debug(`@${process.pid} UNABLE TO CREATE CHANNEL ON RABBITMQ! ${error?.message || ''}`);
            debug(`@${process.pid} RETRYING TO CREATE CHANNEL ON RABBITMQ...`);
        }
        await sleep(this.options.retryInterval);
        return await this.createChannel();
    }

    async reconnect() {
        if (this._reconnecting) return;

        this._reconnecting = true;
        await this.initialize(this.options);
    }

    async loadQueue(_name, _handler) {
        const names = typeof _name === 'string' ? [_name] : _name;
        for (const _name of names) {
            const name = this.formatQueueName(_name);
            this.channel.assertQueue(name, { durable: true, persistent: true });

            this.channel.consume(name, async (data) => {
                try {
                    await this.receiveMessage(name, _handler, data, { events: this, channel: this.channel });
                } catch (error) {
                    console.error(error, { name, content: data.content });
                }
            });
        }
    }

    async _sendToQueue(_name, data) {
        const name = this.formatQueueName(_name);
        if (!this.channel) throw new Error(`@${process.pid} UNABLE TO SEND TO QUEUE ${name}`);
        return this.channel.sendToQueue(name, Buffer.from(JSON.stringify(data)), { persistent: true });
    }

    async close() {
        await this.closeChannel();

        if (!this.connection) return false;
        this.connection.removeAllListeners('close');
        await this.connection.close();

        return true;
    }

    async closeChannel() {
        if (!this.channel) return false;
        await this.channel.close();
    }

    ack(name, message, options) {
        return options.channel.ack(message);
    }

    nack(name, message, options) {
        options.channel.nack(message);
    }
}
