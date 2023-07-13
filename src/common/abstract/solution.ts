import { defaults, defaultsDeep, keys, omit, omitBy, pick } from 'lodash';

export class Solution {
    // protected libraries: any = {};
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
        // await this.loadLibraries();
        this.options.initialized = true;
    }

    isInitialized() {
        if (!this.options.initialized) throw new Error('Nao se esqueça de executar o método "initialized" de cada solução da fábrica');
    }

    // async loadLibraries() {
    //     for (const libName in this.libraries) {
    //         let libConfig = this.libraries[libName];
    //         typeof libConfig === 'string' && (libConfig = { path: libConfig });
    //         this[libName] = (await import(libConfig.path))[libConfig.key || 'default'];
    //     }
    // }

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
