import { ProviderOptions, SolutionsFactoryOptions, SolutionsInterface, SolutionsMapInterface } from './common/interfaces/solutions.interface';
import { adapters } from './common/config';
import { SolutionEnum } from './common/types/solution.enum';
import { partial } from 'lodash';

export class SolutionsFactory {
    providerOptions: Partial<ProviderOptions> = {};
    _solutionsMap: SolutionsMapInterface = {};
    _solutions: SolutionsInterface = {};

    async initialize(options: SolutionsFactoryOptions) {
        await this.setOptions(options);
        await this.instantiate();
        return this.getAll();
    }

    async setSolutionsByCloudProvider(provider: string) {
        for (const solutionType in adapters[provider]) {
            await this.set(solutionType, provider);
        }
    }

    async setOptions(options: SolutionsFactoryOptions) {
        this.providerOptions = options.providerOptions;

        // get solutions available into cloud provider
        await this.setSolutionsByCloudProvider(options.provider);

        // override solutions by specified ones
        if (options.storage) await this.set(SolutionEnum.STORAGE, options.storage);
        if (options.events) await this.set(SolutionEnum.EVENTS, options.events);
        if (options.secrets) await this.set(SolutionEnum.SECRETS, options.secrets);
    }

    async set(solutionType: string, solutionName: string) {
        const adapter = typeof solutionName === 'string' ? this.find(solutionType, solutionName) : solutionName;
        if (adapter) {
            this._solutionsMap[solutionType] = adapter;
        }
    }

    async instantiate() {
        for (const solutionType in this._solutionsMap) {
            const adapter = this._solutionsMap[solutionType];

            if (solutionType === SolutionEnum.CLOUD_PROVIDER) {
                const adapterCooked = partial(adapter, this.providerOptions);
                await adapterCooked();
                this._solutions[solutionType] = adapterCooked;
            } else {
                const instance = new adapter(this.providerOptions);
                this._solutions[solutionType] = instance;
            }
        }
    }

    getAll(): SolutionsInterface {
        return this._solutions;
    }

    get(solutionType: string) {
        return this._solutions[solutionType];
    }

    find(solutionType: string, solutionName: string) {
        return adapters[solutionType] && adapters[solutionType][solutionName];
    }

    static findClass(solutionType: string, solutionName: string) {
        return adapters[solutionType] && adapters[solutionType][solutionName];
    }
}
