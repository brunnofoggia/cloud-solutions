import { Solution } from './solution.js';

export abstract class Events extends Solution {
    protected defaultOptions: any = {
        retryInterval: 5000,
    };

    sendToQueue(_name, data, retry = 10) {
        try {
            this._sendToQueue(_name, data);
        } catch (err) {
            if (retry > 0) {
                return setTimeout(() => this.sendToQueue(_name, data, --retry), this.options.retryInterval);
            }
            throw err;
        }
    }

    _sendToQueue(_name, data) {
        return { _name, data };
    }
}