import AwsDeprecated from '../awsd/index';
import Aws from '../aws/index';
import Gcp from '../gcp/index';
import Local from '../local/index';
import { RabbitMQ } from '../thirdparty/rabbitmq/index';
import { Sftp } from '../thirdparty/sftp';
import { SolutionEnum } from './types/solution.enum';
import { ProviderEnum } from './types/provider.enum';
import { Ftp } from '../thirdparty/ftp';

const adapters: any = {};
adapters[SolutionEnum.CLOUD_PROVIDER] = {};
adapters[SolutionEnum.SECRETS] = {};
adapters[SolutionEnum.STORAGE] = {};
adapters[SolutionEnum.EVENTS] = {};

// AWS V3
adapters[ProviderEnum.AWS] = {};
adapters[ProviderEnum.AWS][SolutionEnum.CLOUD_PROVIDER] = Aws.providerConfig;
adapters[ProviderEnum.AWS][SolutionEnum.SECRETS] = Aws.SecretsAdapter;
adapters[ProviderEnum.AWS][SolutionEnum.STORAGE] = Aws.StorageAdapter;
adapters[ProviderEnum.AWS][SolutionEnum.EVENTS] = Aws.EventsAdapter;
adapters[SolutionEnum.CLOUD_PROVIDER][ProviderEnum.AWS] = Aws.providerConfig;
adapters[SolutionEnum.SECRETS][ProviderEnum.AWS] = Aws.SecretsAdapter;
adapters[SolutionEnum.SECRETS][Aws.SolutionsEnum.SECRETS] = Aws.SecretsAdapter;
adapters[SolutionEnum.STORAGE][ProviderEnum.AWS] = Aws.StorageAdapter;
adapters[SolutionEnum.STORAGE][Aws.SolutionsEnum.STORAGE] = Aws.StorageAdapter;
adapters[SolutionEnum.EVENTS][ProviderEnum.AWS] = Aws.EventsAdapter;
adapters[SolutionEnum.EVENTS][Aws.SolutionsEnum.EVENTS] = Aws.EventsAdapter;

// GCP
adapters[ProviderEnum.GCP] = {};
adapters[ProviderEnum.GCP][SolutionEnum.CLOUD_PROVIDER] = Gcp.providerConfig;
adapters[ProviderEnum.GCP][SolutionEnum.SECRETS] = Gcp.SecretsAdapter;
adapters[ProviderEnum.GCP][SolutionEnum.STORAGE] = Gcp.StorageAdapter;
adapters[SolutionEnum.CLOUD_PROVIDER][ProviderEnum.GCP] = Gcp.providerConfig;
adapters[SolutionEnum.SECRETS][ProviderEnum.GCP] = Gcp.SecretsAdapter;
adapters[SolutionEnum.SECRETS][Gcp.SolutionsEnum.SECRETS] = Gcp.SecretsAdapter;
adapters[SolutionEnum.STORAGE][ProviderEnum.GCP] = Gcp.StorageAdapter;
adapters[SolutionEnum.STORAGE][Gcp.SolutionsEnum.STORAGE] = Gcp.StorageAdapter;
// adapters[SolutionEnum.EVENTS][ProviderEnum.GCP] = Gcp.EventsAdapter;
// adapters[SolutionEnum.EVENTS][Gcp.SolutionsEnum.EVENTS] = Gcp.EventsAdapter;
// adapters[ProviderEnum.GCP][SolutionEnum.EVENTS] = Gcp.EventsAdapter;

// AWS DEPRECATED
adapters[ProviderEnum.AWSDEPRECATED] = {};
adapters[ProviderEnum.AWSDEPRECATED][SolutionEnum.CLOUD_PROVIDER] = AwsDeprecated.providerConfig;
adapters[ProviderEnum.AWSDEPRECATED][SolutionEnum.SECRETS] = AwsDeprecated.SecretsAdapter;
adapters[ProviderEnum.AWSDEPRECATED][SolutionEnum.STORAGE] = AwsDeprecated.StorageAdapter;
adapters[ProviderEnum.AWSDEPRECATED][SolutionEnum.EVENTS] = AwsDeprecated.EventsAdapter;
adapters[SolutionEnum.CLOUD_PROVIDER][ProviderEnum.AWSDEPRECATED] = AwsDeprecated.providerConfig;
adapters[SolutionEnum.SECRETS][ProviderEnum.AWSDEPRECATED] = AwsDeprecated.SecretsAdapter;
adapters[SolutionEnum.SECRETS][AwsDeprecated.SolutionsEnum.SECRETS] = AwsDeprecated.SecretsAdapter;
adapters[SolutionEnum.STORAGE][ProviderEnum.AWSDEPRECATED] = AwsDeprecated.StorageAdapter;
adapters[SolutionEnum.STORAGE][AwsDeprecated.SolutionsEnum.STORAGE] = AwsDeprecated.StorageAdapter;
adapters[SolutionEnum.EVENTS][ProviderEnum.AWSDEPRECATED] = AwsDeprecated.EventsAdapter;
adapters[SolutionEnum.EVENTS][AwsDeprecated.SolutionsEnum.EVENTS] = AwsDeprecated.EventsAdapter;

// LOCAL
adapters[ProviderEnum.LOCAL] = {};
adapters[ProviderEnum.LOCAL][SolutionEnum.CLOUD_PROVIDER] = Local.providerConfig;
adapters[ProviderEnum.LOCAL][SolutionEnum.SECRETS] = Local.SecretsAdapter;
adapters[ProviderEnum.LOCAL][SolutionEnum.STORAGE] = Local.StorageAdapter;
adapters[ProviderEnum.LOCAL][SolutionEnum.EVENTS] = Local.EventsAdapter;
adapters[SolutionEnum.CLOUD_PROVIDER][ProviderEnum.LOCAL] = Local.providerConfig;
adapters[SolutionEnum.SECRETS][ProviderEnum.LOCAL] = Local.SecretsAdapter;
adapters[SolutionEnum.SECRETS][Local.SolutionsEnum.SECRETS] = Local.SecretsAdapter;
adapters[SolutionEnum.STORAGE][ProviderEnum.LOCAL] = Local.StorageAdapter;
adapters[SolutionEnum.STORAGE][Local.SolutionsEnum.STORAGE] = Local.StorageAdapter;
adapters[SolutionEnum.EVENTS][ProviderEnum.LOCAL] = Local.EventsAdapter;
adapters[SolutionEnum.EVENTS][Local.SolutionsEnum.EVENTS] = Local.EventsAdapter;

// THIRDPARTY
adapters[SolutionEnum.EVENTS][RabbitMQ.getName()] = RabbitMQ;
adapters[SolutionEnum.STORAGE][Sftp.getName()] = Sftp;
adapters[SolutionEnum.STORAGE][Ftp.getName()] = Ftp;

export { adapters };
