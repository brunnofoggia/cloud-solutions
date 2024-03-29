import _debug from 'debug';
const debug = _debug('solutions:events');

import { sleep } from '../utils/index';
import { Solution } from './solution';

export abstract class Events extends Solution {
    protected _isConnected = false;
    public defaultOptions: any = {
        retryInterval: 5000,
        maxNumberOfMessages: 1,
    };

    async sendToQueue(_name, data, retry = 10) {
        try {
            !data && (data = {});
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
        return message.Body || message.content || '{}';
    }

    formatMessageBody(message) {
        const body = this.getMessageBody(message);
        try {
            if (/^[[{]/.test(body)) return JSON.parse(body);
            return body;
        } catch (error) {
            debug('JSON Parse error at formatMessageBody:', error.message);
            return false;
        }
    }

    async receiveMessage(name, handler, message, options) {
        debug(`@${process.pid} Executing Queue ${name}`);
        const body = this.formatMessageBody(message);
        if (body === false) {
            debug(`@${process.pid} Aborting Queue`);
            return await this.ack(name, message, options);
        }

        try {
            const result = await handler(body, {
                events: options.events,
                name,
            });
            if (result !== false) return await this.ack(name, message, options);
        } catch (error) {
            await this.nack(name, message, options);
            debug(`@${process.pid} Error on Queue:`);
            debug(`Code: ${error.code}; Status: ${error.status}; Message: ${error.message}`);
            if (options.events.getOptions().throwError) {
                debug(`Trace:`);
                throw error;
            }
            return;
        }
        await this.nack(name, message, options);
    }

    formatQueueName(_name) {
        return _name.replace(/\//g, '-');
    }

    isConnected() {
        return this._isConnected;
    }

    abstract ack(name, message, options): any;
    abstract nack(name, message, options): any;
}
