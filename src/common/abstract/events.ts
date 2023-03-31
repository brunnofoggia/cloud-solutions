
import _debug from 'debug';
const debug = _debug('app:solutions:events');

import { sleep } from '../utils/index.js';
import { Solution } from './solution.js';

export abstract class Events extends Solution {
    public defaultOptions: any = {
        retryInterval: 5000,
    };

    async sendToQueue(_name, data, retry = 10) {
        try {
            await this._sendToQueue(_name, data);
        } catch (error) {
            if (retry > 0) {
                await sleep(this.options.retryInterval);
                return await this.sendToQueue(_name, data, --retry);
            }
            debug('sendToQueue:', error.message);
        }
    }

    async _sendToQueue(_name, data): Promise<any> {
        return { _name, data };
    }

    getMessageBody(message) {
        return message.Body || message.content;
    }

    formatMessageBody(message) {
        const body = this.getMessageBody(message);
        try {
            if (/^[[{]/.test(body))
                return JSON.parse(body);
            return body;
        } catch (error) {
            debug('formatMessageBody:', error.message);
        }
    }

    async receiveMessage(name, handler, message, options) {
        const body = this.formatMessageBody(message);
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

    formatQueueName(_name) {
        return _name.replace(/\//g, '-');
    }

    abstract ack(name, message, options): any;
    abstract nack(name, message, options): any;
}