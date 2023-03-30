import amqplib from 'amqplib';
import _debug from 'debug';
import { sleep } from '../common/utils/index.js';
import { EventsInterface } from '../common/interfaces/events.interface.js';
import { Events } from '../common/abstract/events.js';

const debug = _debug('app:solutions:events');

export class RabbitMQ extends Events implements EventsInterface {
    private connection = null;
    private channel = null;
    private _reconnecting = false;

    private async connect() {
        try {
            const host = this.options.host || 'localhost';
            const port = this.options.port || '5672';
            const user = this.options.user || 'guest';
            const pass = this.options.pass || 'guest';

            this.connection = await amqplib.connect(`amqp://${user}:${pass}@${host}:${port}`);

            this.connection.once("close", async () => {
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
            this.channel.once("close", async () => {
                debug(`@${process.pid} RABBITMQ CHANNEL CLOSED. RETRYING TO CREATE CHANNEL ON RABBITMQ... ${new Date}`);
                this.reconnect();
            });
            this.channel.on("error", async (error) => {
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

    async initialize(options: any = {}) {
        this.setOptions(options);
        this.options.isConsumer = options.isConsumer || true;

        await this.connect();
        await this.createChannel();
        this.options.loadQueues && (await this.options.loadQueues(this));
        this._reconnecting = false;
    }

    loadQueue(_name, _handler) {
        const names = typeof _name === 'string' ? [_name] : _name;
        for (const _name of names) {
            this.channel.assertQueue(_name, { durable: true, persistent: true });

            this.channel.consume(_name, async data => {
                try { await handler(this, _name, _handler, data, this.channel); }
                catch (error) { console.error(error, { name: _name, content: data.content }); }
            });
        }
    }

    _sendToQueue(_name, data) {
        if (!this.channel) throw new Error(`@${process.pid} UNABLE TO SEND TO QUEUE ${_name}`);
        return this.channel.sendToQueue(_name, Buffer.from(JSON.stringify(data)), { persistent: true });
    }

    async close() {
        await this.closeChannel();

        if (!this.connection) return false;
        this.connection.removeAllListeners("close");
        await this.connection.close();

        return true;
    }

    async closeChannel() {
        if (!this.channel) return false;
        await this.channel.close();
    }
}

const handler = async function (events, queueName, queueFn, message, channel) {
    const body = JSON.parse(message.content);
    debug(`@${process.pid} Executing Queue ${queueName}`);

    try {
        const result = await queueFn(body, {
            events,
            queueName
        });
        if (result !== false)
            return channel.ack(message);
    }
    catch (error) {
        channel.nack(message);
        debug(`@${process.pid} Error on Queue:`);
        debug(`Code: ${error.code}; Status: ${error.status}; Message: ${error.message}`);
        if (events.getOptions().throwError) {
            debug(`Trace:`);
            throw error;
        }
        return;
    }
    return channel.nack(message);
};