import _debug from 'debug';
const debug = _debug('solutions:events');
const log = _debug('solutions:essential:events');

import { sleep } from '../utils/index';
import { Solution } from './solution';
import { cloneDeep, defaultsDeep } from 'lodash';

export const eventsDefaultOptions = {
    retryInterval: 5000,
    retryLimit: 3,
    maxNumberOfMessages: 1,
};

export abstract class Events extends Solution {
    protected _isConnected = false;
    public defaultOptions: any = cloneDeep(eventsDefaultOptions);

    async sendToQueue(_name, data, options: any = {}) {
        const _options = defaultsDeep(options, { retry: this.getOptions().retryLimit });
        try {
            !data && (data = {});
            await this._sendToQueue(_name, data, _options);
        } catch (error) {
            if (_options.retry > 0) {
                const retryInterval = this.getOptions().retryInterval;
                log(`@${process.pid} Retrying sendToQueue`, retryInterval, error.message);
                await sleep(retryInterval);
                _options.retry--;
                return await this.sendToQueue(_name, data, _options);
            }
            throw error;
        }
    }

    async _sendToQueue(_name, data, options: any = {}): Promise<any> {
        return { _name, data, options };
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
            log('JSON Parse error at formatMessageBody:', error.message);
            return false;
        }
    }

    async receiveMessage(name, handler, message, options) {
        debug(`@${process.pid} Executing Queue ${name}`);
        // // message was successfully received. Rather or not it was processed successfully is another story.
        // await this.ack(name, message, options);

        const body = this.formatMessageBody(message);
        if (body === false) {
            log(`@${process.pid} Aborting Queue (body is not a valid json):`, message);
            await this.ack(name, message, options);
            return;
        }

        try {
            const result = await handler(body, {
                events: options.events,
                name,
            });
            if (result !== false) return await this.ack(name, message, options);
        } catch (error) {
            log(`@${process.pid} Error on Queue:`);
            log(`Code: ${error.code}; Status: ${error.status}; Message: ${error.message}`);
            await this.nack(name, message, options);
            if (options.events.getOptions().throwError) {
                debug(`Trace:`);
                throw error;
            }
            return;
        }
        await this.nack(name, message, options);
    }

    getPrefix(options: any = {}) {
        return (options.prefix || this.getOptions().prefix || '').trim();
    }

    formatQueueName(_name, options: any = {}) {
        const prefix = this.getPrefix(options);

        const parts = [];
        if (prefix) parts.push(prefix);
        parts.push(_name);

        const name = parts.join('-').replace(/\//g, '-');
        return name;
    }

    isConnected() {
        return this._isConnected;
    }

    abstract ack(name, message, options): any;
    abstract nack(name, message, options): any;
}
