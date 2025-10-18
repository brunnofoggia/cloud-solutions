import { SolutionsEnum } from './solutions.interface';
import { SolutionEnum } from '../common/types/solution.enum';
import { S3 } from './storage/index';
import { ParameterStore } from './secrets/index';
import { SQS } from './events/index';
import { providerConfig } from '.';

export const StorageAdapter = S3;
export const SecretsAdapter = ParameterStore;
export const EventsAdapter = SQS;

const Adapters: any = {};
Adapters[SolutionEnum.CLOUD_PROVIDER] = providerConfig;
Adapters[SolutionEnum.SECRETS] = SecretsAdapter;
Adapters[SolutionEnum.STORAGE] = StorageAdapter;
Adapters[SolutionEnum.EVENTS] = EventsAdapter;

export { SolutionsEnum, Adapters };
