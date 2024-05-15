import { cloneDeep, defaults, defaultsDeep, keys, omit, omitBy, pick } from 'lodash';

export class Solution {
    protected libraries: any = {};
    protected libraryImport: any = {};
    protected providerOptions: any = {};
    protected options: any = {};
    protected defaultOptions: any = {};

    constructor(providerOptions: any = {}) {
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
        await this.loadLibraries();
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

    /* libraries */
    async loadLibraries() {
        if (this.options.initialized) return;
        this.libraryImport = await Solution.loadLibraries(this.libraries);
    }

    static async loadLibraries(_libraries) {
        const libraries = Solution.prepareLibrariesConfig(_libraries);
        const libraryImport: any = {};
        for (const alias in libraries) {
            const config = libraries[alias];
            libraryImport[alias] = await Solution.loadLibrary(config);
        }

        return libraryImport;
    }

    static async loadLibrary(config) {
        try {
            return (await import(config.path))[config.key || 'default'];
        } catch (error) {
            if (error.message.startsWith(`Cannot find module '${config.path}'`)) {
                const version = config.version ? `@${config.version}` : '';
                error.message = `Install '${config.path}${version}' on your project`;
            }
            throw error;
        }
    }

    static prepareLibrariesConfig(_libraries) {
        const libraries = cloneDeep(_libraries);
        const librariesConfig: any = {};
        for (const alias in libraries) {
            let libConfig = libraries[alias];
            typeof libConfig === 'string' && (libConfig = { path: libConfig });

            librariesConfig[alias] = libConfig;
        }
        return librariesConfig;
    }

    static prepareLibraryConfig(_config) {
        const config = typeof _config === 'string' ? { path: _config } : _config;
        return config;
    }

    getLibrary(alias) {
        return this.libraryImport[alias];
    }
}
