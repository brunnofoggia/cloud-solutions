import { SolutionsInterface, SolutionsMapInterface } from './common/interfaces/solutions.interface';
import { adapters } from './common/config';
import { SolutionEnum } from './common/types/solution.enum';

export class SolutionsFactory {
    private providerOptions: any = {};
    private _solutionsMap: SolutionsMapInterface = {};
    private _solutions: SolutionsInterface = {};

    async initialize({ storage = '', events = '', secrets = '', provider = '', providerOptions = {} }) {
        await this.setOptions(storage, events, secrets, provider, providerOptions);
        return this.getAll();
    }

    private async set(solutionType: string, solutionName: string) {
        const adapter = typeof solutionName === 'string' ? this.find(solutionType, solutionName) : solutionName;
        if (adapter) {
            this._solutionsMap[solutionType] = adapter;
        }
    }

    private async instantiate() {
        for (const solutionType in this._solutionsMap) {
            const adapter = this._solutionsMap[solutionType];

            if (solutionType === SolutionEnum.PROVIDERCONFIG) {
                await adapter(this.providerOptions);
                this._solutions[solutionType] = adapter;
            } else {
                const instance = new adapter(this.providerOptions);
                this._solutions[solutionType] = instance;
            }
        }
    }

    private async setProvider(provider: string) {
        for (const solutionType in adapters) {
            await this.set(solutionType, provider);
        }
    }

    async setOptions(storage, events, secrets, provider, providerOptions) {
        this.providerOptions = providerOptions;
        await this.setProvider(provider);

        if (storage) await this.set(SolutionEnum.STORAGE, storage);
        if (events) await this.set(SolutionEnum.EVENTS, events);
        if (secrets) await this.set(SolutionEnum.SECRETS, secrets);

        await this.instantiate();
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
