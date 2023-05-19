export class Solution {
    protected providerOptions: any = {};
    protected options: any = {};
    protected defaultOptions: any = {};

    constructor(providerOptions) {
        this.providerOptions = providerOptions;
    }

    setOptions(options: any = {}) {
        this.options = { ...this.defaultOptions, ...options };
    }

    getOptions() {
        return {
            ...this.options,
        };
    }

    checkOptions() {
        return true;
    }

    async initialize(options: any = {}) {
        this.setOptions(options);
    }
}