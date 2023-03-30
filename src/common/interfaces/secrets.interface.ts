export interface SecretsInterface {
    initialize(options: any);
    getSecretValue(path);
    getValue(path);
}