import { Ftp } from './ftp';
import { Keycloak } from './keycloak';
import { RabbitMQ } from './rabbitmq';
import { Sftp } from './sftp';
import { SolutionsEnum } from './solutions.interface';

const Adapters: any = {};
Adapters[SolutionsEnum.EVENTS_RABBITMQ] = RabbitMQ;
Adapters[SolutionsEnum.STORAGE_SFTP] = Sftp;
Adapters[SolutionsEnum.STORAGE_FTP] = Ftp;
Adapters[SolutionsEnum.AUTH_KEYCLOAK] = Keycloak;

export { SolutionsEnum, Adapters };
