import { SolutionEnum } from './types/solution.enum';
import { ProviderEnum } from './types/provider.enum';

import { Adapters as AwsV2Adapters, SolutionsEnum as AwsV2SolutionsEnum } from '../awsv2/index';
import { Adapters as AwsAdapters, SolutionsEnum as AwsSolutionsEnum } from '../aws/adapters';
import { Adapters as GcpAdapters, SolutionsEnum as GcpSolutionsEnum } from '../gcp/index';
import { Adapters as LocalAdapters, SolutionsEnum as LocalSolutionsEnum } from '../local/index';
import { Adapters as ThirdAdapters, SolutionsEnum as ThirdSolutionsEnum } from '../thirdparty/index';

const adapters: any = {};
// group of solutions by type
adapters[SolutionEnum.CLOUD_PROVIDER] = {};
adapters[SolutionEnum.SECRETS] = {};
adapters[SolutionEnum.STORAGE] = {};
adapters[SolutionEnum.EVENTS] = {};
adapters[SolutionEnum.AUTH] = {};

// AWS V3
adapters[ProviderEnum.AWS] = AwsAdapters;
// setup from cloud alias
adapters[SolutionEnum.CLOUD_PROVIDER][ProviderEnum.AWS] = AwsAdapters[SolutionEnum.CLOUD_PROVIDER];
adapters[SolutionEnum.SECRETS][ProviderEnum.AWS] = AwsAdapters[SolutionEnum.SECRETS];
adapters[SolutionEnum.STORAGE][ProviderEnum.AWS] = AwsAdapters[SolutionEnum.STORAGE];
adapters[SolutionEnum.EVENTS][ProviderEnum.AWS] = AwsAdapters[SolutionEnum.EVENTS];
// setup from solution alias
adapters[SolutionEnum.SECRETS][AwsSolutionsEnum.SECRETS] = AwsAdapters[SolutionEnum.SECRETS];
adapters[SolutionEnum.STORAGE][AwsSolutionsEnum.STORAGE] = AwsAdapters[SolutionEnum.STORAGE];
adapters[SolutionEnum.EVENTS][AwsSolutionsEnum.EVENTS] = AwsAdapters[SolutionEnum.EVENTS];

// GCP
adapters[ProviderEnum.GCP] = GcpAdapters;
// setup from cloud alias
adapters[SolutionEnum.CLOUD_PROVIDER][ProviderEnum.GCP] = GcpAdapters[SolutionEnum.CLOUD_PROVIDER];
adapters[SolutionEnum.SECRETS][ProviderEnum.GCP] = GcpAdapters[SolutionEnum.SECRETS];
adapters[SolutionEnum.STORAGE][ProviderEnum.GCP] = GcpAdapters[SolutionEnum.STORAGE];
// adapters[SolutionEnum.EVENTS][ProviderEnum.GCP] = Gcp.EventsAdapter;
// setup from solution alias
adapters[SolutionEnum.SECRETS][GcpSolutionsEnum.SECRETS] = GcpAdapters[SolutionEnum.SECRETS];
adapters[SolutionEnum.STORAGE][GcpSolutionsEnum.STORAGE] = GcpAdapters[SolutionEnum.STORAGE];
// adapters[SolutionEnum.EVENTS][Gcp.SolutionsEnum.EVENTS] = Gcp.EventsAdapter;

// AWS V2
adapters[ProviderEnum.AWSV2] = AwsV2Adapters;
// setup from cloud alias
adapters[SolutionEnum.CLOUD_PROVIDER][ProviderEnum.AWSV2] = AwsV2Adapters[SolutionEnum.CLOUD_PROVIDER];
adapters[SolutionEnum.SECRETS][ProviderEnum.AWSV2] = AwsV2Adapters[SolutionEnum.SECRETS];
adapters[SolutionEnum.STORAGE][ProviderEnum.AWSV2] = AwsV2Adapters[SolutionEnum.STORAGE];
adapters[SolutionEnum.EVENTS][ProviderEnum.AWSV2] = AwsV2Adapters[SolutionEnum.EVENTS];
// setup from solution alias
adapters[SolutionEnum.SECRETS][AwsV2SolutionsEnum.SECRETS] = AwsV2Adapters[SolutionEnum.SECRETS];
adapters[SolutionEnum.STORAGE][AwsV2SolutionsEnum.STORAGE] = AwsV2Adapters[SolutionEnum.STORAGE];
adapters[SolutionEnum.EVENTS][AwsV2SolutionsEnum.EVENTS] = AwsV2Adapters[SolutionEnum.EVENTS];

// LOCAL
adapters[ProviderEnum.LOCAL] = LocalAdapters;
// setup from "cloud" alias
adapters[SolutionEnum.CLOUD_PROVIDER][ProviderEnum.LOCAL] = LocalAdapters[SolutionEnum.CLOUD_PROVIDER];
adapters[SolutionEnum.SECRETS][ProviderEnum.LOCAL] = LocalAdapters[SolutionEnum.SECRETS];
adapters[SolutionEnum.STORAGE][ProviderEnum.LOCAL] = LocalAdapters[SolutionEnum.STORAGE];
adapters[SolutionEnum.EVENTS][ProviderEnum.LOCAL] = LocalAdapters[SolutionEnum.EVENTS];
// setup from solution alias
adapters[SolutionEnum.SECRETS][LocalSolutionsEnum.SECRETS] = LocalAdapters[SolutionEnum.SECRETS];
adapters[SolutionEnum.STORAGE][LocalSolutionsEnum.STORAGE] = LocalAdapters[SolutionEnum.STORAGE];
adapters[SolutionEnum.EVENTS][LocalSolutionsEnum.EVENTS] = LocalAdapters[SolutionEnum.EVENTS];

// THIRDPARTY
// setup from solution alias only
adapters[SolutionEnum.EVENTS][ThirdSolutionsEnum.EVENTS_RABBITMQ] = ThirdAdapters[ThirdSolutionsEnum.EVENTS_RABBITMQ];
adapters[SolutionEnum.STORAGE][ThirdSolutionsEnum.STORAGE_SFTP] = ThirdAdapters[ThirdSolutionsEnum.STORAGE_SFTP];
adapters[SolutionEnum.STORAGE][ThirdSolutionsEnum.STORAGE_FTP] = ThirdAdapters[ThirdSolutionsEnum.STORAGE_FTP];
adapters[SolutionEnum.AUTH][ThirdSolutionsEnum.AUTH_KEYCLOAK] = ThirdAdapters[ThirdSolutionsEnum.AUTH_KEYCLOAK];

export { adapters };
