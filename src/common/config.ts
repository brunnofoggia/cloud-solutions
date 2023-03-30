import Aws from '../aws/index.js';
import Local from '../local/index.js';
import { RabbitMQ } from '../rabbitmq/index.js';
import { SolutionEnum } from './types/solution.enum.js';
import { ProviderEnum } from './types/provider.enum.js';

const adapters: any = {};
adapters[SolutionEnum.PROVIDERCONFIG] = {};
adapters[SolutionEnum.SECRETS] = {};
adapters[SolutionEnum.STORAGE] = {};
adapters[SolutionEnum.EVENTS] = {};

// AWS
adapters[SolutionEnum.PROVIDERCONFIG][ProviderEnum.AWS] = Aws.providerConfig;
adapters[SolutionEnum.SECRETS][ProviderEnum.AWS] = Aws.SecretsAdapter;
adapters[SolutionEnum.SECRETS][Aws.SolutionsEnum.SECRETS] = Aws.SecretsAdapter;
adapters[SolutionEnum.STORAGE][ProviderEnum.AWS] = Aws.StorageAdapter;
adapters[SolutionEnum.STORAGE][Aws.SolutionsEnum.STORAGE] = Aws.StorageAdapter;

// LOCAL
adapters[SolutionEnum.PROVIDERCONFIG][ProviderEnum.LOCAL] = Local.providerConfig;
adapters[SolutionEnum.SECRETS][ProviderEnum.LOCAL] = Local.SecretsAdapter;
adapters[SolutionEnum.SECRETS][Local.SolutionsEnum.SECRETS] = Local.SecretsAdapter;
adapters[SolutionEnum.STORAGE][ProviderEnum.LOCAL] = Local.StorageAdapter;
adapters[SolutionEnum.STORAGE][Local.SolutionsEnum.STORAGE] = Local.StorageAdapter;

// OTHERS
adapters[SolutionEnum.EVENTS][RabbitMQ.name.toLowerCase()] = RabbitMQ;

export { adapters };