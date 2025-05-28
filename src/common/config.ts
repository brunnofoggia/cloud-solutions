import Aws from '../aws/index';
import Awsn from '../awsn/index';
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

// AWS
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

// AWS
adapters[ProviderEnum.AWSN] = {};
adapters[ProviderEnum.AWSN][SolutionEnum.CLOUD_PROVIDER] = Awsn.providerConfig;
adapters[ProviderEnum.AWSN][SolutionEnum.SECRETS] = Awsn.SecretsAdapter;
adapters[ProviderEnum.AWSN][SolutionEnum.STORAGE] = Awsn.StorageAdapter;
adapters[ProviderEnum.AWSN][SolutionEnum.EVENTS] = Awsn.EventsAdapter;
adapters[SolutionEnum.CLOUD_PROVIDER][ProviderEnum.AWSN] = Awsn.providerConfig;
adapters[SolutionEnum.SECRETS][ProviderEnum.AWSN] = Awsn.SecretsAdapter;
adapters[SolutionEnum.SECRETS][Awsn.SolutionsEnum.SECRETS] = Awsn.SecretsAdapter;
adapters[SolutionEnum.STORAGE][ProviderEnum.AWSN] = Awsn.StorageAdapter;
adapters[SolutionEnum.STORAGE][Awsn.SolutionsEnum.STORAGE] = Awsn.StorageAdapter;
adapters[SolutionEnum.EVENTS][ProviderEnum.AWSN] = Awsn.EventsAdapter;
adapters[SolutionEnum.EVENTS][Awsn.SolutionsEnum.EVENTS] = Awsn.EventsAdapter;

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
