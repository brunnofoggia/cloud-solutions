import { Env } from './secrets/index';
import { SolutionsEnum } from './solutions';
import { Fs } from './storage/index';
import { QueueMock } from './events/index';

export const SecretsAdapter = Env;
export const StorageAdapter = Fs;
export const EventsAdapter = QueueMock;

export const providerConfig = () => { null; };

export default { SecretsAdapter, StorageAdapter, EventsAdapter, SolutionsEnum, providerConfig };