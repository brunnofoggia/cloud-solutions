import { Env } from './secrets/index.js';
import { SolutionsEnum } from './solutions.js';
import { Fs } from './storage/index.js';

export const SecretsAdapter = Env;
export const StorageAdapter = Fs;

export const providerConfig = () => { null; };

export default { SecretsAdapter, StorageAdapter, SolutionsEnum, providerConfig };