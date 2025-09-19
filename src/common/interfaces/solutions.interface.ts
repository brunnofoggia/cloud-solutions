import { SolutionsEnum as AwsSolutionsEnum } from '../../aws/solutions.interface';
import { SolutionsEnum as AwsV2SolutionsEnum } from '../../awsv2/solutions.interface';
import { SolutionsEnum as GcpSolutionsEnum } from '../../gcp/solutions.interface';
import { SolutionsEnum as LocalSolutionsEnum } from '../../local/solutions.interface';
import { SolutionsEnum as ThirdSolutionsEnum } from '../../thirdparty/solutions.interface';

import { ProviderEnum } from '../types/provider.enum';
import { EventsInterface } from './events.interface';
import { SecretsInterface } from './secrets.interface';
import { StorageInterface } from './storage.interface';

export interface SolutionsInterface {
    storage?: StorageInterface;
    secrets?: SecretsInterface;
    events?: EventsInterface;
}

export interface SolutionsMapInterface {
    storage?: any;
    secrets?: any;
    events?: any;
}

export interface SolutionsFactoryOptions {
    storage?: ProviderEnum | StorageEnum | string;
    events?: ProviderEnum | EventsEnum | string;
    secrets?: ProviderEnum | SecretsEnum | string;
    provider?: ProviderEnum | string;
    providerOptions?: ProviderOptions;
}

export interface ProviderOptions {
    user: string;
    pass: string;
    // cloud provider region (aws, azure, gcp)
    region?: string;
    // project ID (gcp only)
    project?: string;
}

export type StorageEnum =
    | AwsSolutionsEnum.STORAGE
    | AwsV2SolutionsEnum.STORAGE
    | GcpSolutionsEnum.STORAGE
    | LocalSolutionsEnum.STORAGE
    | ThirdSolutionsEnum.STORAGE_SFTP
    | ThirdSolutionsEnum.STORAGE_FTP;

export type EventsEnum =
    | AwsSolutionsEnum.EVENTS
    | AwsV2SolutionsEnum.EVENTS
    // | GcpSolutionsEnum.EVENTS
    | LocalSolutionsEnum.EVENTS
    | ThirdSolutionsEnum.EVENTS_RABBITMQ;

export type SecretsEnum =
    | AwsSolutionsEnum.SECRETS
    | AwsV2SolutionsEnum.SECRETS
    | GcpSolutionsEnum.SECRETS
    //
    | LocalSolutionsEnum.SECRETS;
