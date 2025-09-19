import { Env } from './secrets/index';
import { SolutionsEnum } from './solutions.interface';
import { Fs } from './storage/index';
import { QueueMock } from './events/index';
import { SolutionEnum } from '../common/types/solution.enum';

export const SecretsAdapter = Env;
export const StorageAdapter = Fs;
export const EventsAdapter = QueueMock;

export const providerConfig = () => {
    null;
};

const Adapters: any = {};
Adapters[SolutionEnum.CLOUD_PROVIDER] = providerConfig;
Adapters[SolutionEnum.SECRETS] = SecretsAdapter;
Adapters[SolutionEnum.STORAGE] = StorageAdapter;
Adapters[SolutionEnum.EVENTS] = EventsAdapter;

export { SolutionsEnum, Adapters };
export default { SecretsAdapter, StorageAdapter, EventsAdapter, SolutionsEnum, providerConfig };
