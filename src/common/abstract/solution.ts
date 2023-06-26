import { defaults, defaultsDeep, keys, omit, omitBy, pick } from 'lodash';

export class Solution {
    protected providerOptions: any = {};
    protected options: any = {};
    protected defaultOptions: any = {};

    constructor(providerOptions) {
        this.providerOptions = providerOptions;
    }

    setOptions(options: any = {}) {
        this.options = defaultsDeep({}, options, this.defaultOptions);
    }

    getOptions() {
        return omit(
            {
                ...this.options,
            },
            'initialized',
        );
    }

    checkOptions() {
        return true;
    }

    async initialize(options: any = {}) {
        this.setOptions(options);
        this.options.initialized = true;
    }

    isInitialized() {
        if (!this.options.initialized) throw new Error('Nao se esqueça de executar o método "initialized" de cada solução da fábrica');
    }

    mergeProviderOptions(options = {}, keyFields) {
        return defaults(
            omitBy(pick(options, ...keys(keyFields)), (value) => !value),
            this.getProviderOptions(keyFields),
        );
    }

    getProviderOptions(keyFields) {
        return pick(this.providerOptions, ...keys(keyFields));
    }
}
