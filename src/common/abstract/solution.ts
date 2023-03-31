export abstract class Solution {
    protected options: any = {};
    protected defaultOptions: any = {};

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