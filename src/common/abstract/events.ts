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
            throw error;
        }
    }

    async _sendToQueue(_name, data): Promise<any> {
        return { _name, data };
    }
}