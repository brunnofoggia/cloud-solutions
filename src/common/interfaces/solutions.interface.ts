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