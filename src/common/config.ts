import Aws from '../aws/index';
import Gcp from '../gcp/index';
import Local from '../local/index';
import { RabbitMQ } from '../thirdparty/rabbitmq/index';
import { SolutionEnum } from './types/solution.enum';
import { ProviderEnum } from './types/provider.enum';

const adapters: any = {};
adapters[SolutionEnum.PROVIDERCONFIG] = {};
adapters[SolutionEnum.SECRETS] = {};
adapters[SolutionEnum.STORAGE] = {};
adapters[SolutionEnum.EVENTS] = {};

// AWS
adapters[ProviderEnum.AWS] = {};
adapters[SolutionEnum.PROVIDERCONFIG][ProviderEnum.AWS] = Aws.providerConfig;
adapters[ProviderEnum.AWS][SolutionEnum.PROVIDERCONFIG] = Aws.providerConfig;
adapters[SolutionEnum.SECRETS][ProviderEnum.AWS] = Aws.SecretsAdapter;
adapters[SolutionEnum.SECRETS][Aws.SolutionsEnum.SECRETS] = Aws.SecretsAdapter;
adapters[ProviderEnum.AWS][SolutionEnum.SECRETS] = Aws.SecretsAdapter;
adapters[SolutionEnum.STORAGE][ProviderEnum.AWS] = Aws.StorageAdapter;
adapters[SolutionEnum.STORAGE][Aws.SolutionsEnum.STORAGE] = Aws.StorageAdapter;
adapters[ProviderEnum.AWS][SolutionEnum.STORAGE] = Aws.StorageAdapter;
adapters[SolutionEnum.EVENTS][ProviderEnum.AWS] = Aws.EventsAdapter;
adapters[SolutionEnum.EVENTS][Aws.SolutionsEnum.EVENTS] = Aws.EventsAdapter;
adapters[ProviderEnum.AWS][SolutionEnum.EVENTS] = Aws.EventsAdapter;

// GCP
adapters[SolutionEnum.PROVIDERCONFIG][ProviderEnum.GCP] = Gcp.providerConfig;
adapters[ProviderEnum.GCP][SolutionEnum.PROVIDERCONFIG] = Gcp.providerConfig;
adapters[SolutionEnum.SECRETS][ProviderEnum.GCP] = Gcp.SecretsAdapter;
adapters[SolutionEnum.SECRETS][Gcp.SolutionsEnum.SECRETS] = Gcp.SecretsAdapter;
adapters[ProviderEnum.GCP][SolutionEnum.SECRETS] = Gcp.SecretsAdapter;
adapters[SolutionEnum.STORAGE][ProviderEnum.GCP] = Gcp.StorageAdapter;
adapters[SolutionEnum.STORAGE][Gcp.SolutionsEnum.STORAGE] = Gcp.StorageAdapter;
adapters[ProviderEnum.GCP][SolutionEnum.STORAGE] = Gcp.StorageAdapter;
// adapters[SolutionEnum.EVENTS][ProviderEnum.GCP] = Gcp.EventsAdapter;
// adapters[SolutionEnum.EVENTS][Gcp.SolutionsEnum.EVENTS] = Gcp.EventsAdapter;
// adapters[ProviderEnum.GCP][SolutionEnum.EVENTS] = Gcp.EventsAdapter;

// LOCAL
adapters[SolutionEnum.PROVIDERCONFIG][ProviderEnum.LOCAL] = Local.providerConfig;
adapters[ProviderEnum.LOCAL][SolutionEnum.PROVIDERCONFIG] = Local.providerConfig;
adapters[SolutionEnum.SECRETS][ProviderEnum.LOCAL] = Local.SecretsAdapter;
adapters[SolutionEnum.SECRETS][Local.SolutionsEnum.SECRETS] = Local.SecretsAdapter;
adapters[ProviderEnum.LOCAL][SolutionEnum.SECRETS] = Local.SecretsAdapter;
adapters[SolutionEnum.STORAGE][ProviderEnum.LOCAL] = Local.StorageAdapter;
adapters[SolutionEnum.STORAGE][Local.SolutionsEnum.STORAGE] = Local.StorageAdapter;
adapters[ProviderEnum.LOCAL][SolutionEnum.STORAGE] = Local.StorageAdapter;
adapters[SolutionEnum.EVENTS][ProviderEnum.LOCAL] = Local.EventsAdapter;
adapters[SolutionEnum.EVENTS][Local.SolutionsEnum.EVENTS] = Local.EventsAdapter;
adapters[ProviderEnum.LOCAL][SolutionEnum.EVENTS] = Local.EventsAdapter;

// OTHERS
adapters[SolutionEnum.EVENTS][RabbitMQ.name.toLowerCase()] = RabbitMQ;

export { adapters };
