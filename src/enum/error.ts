import { ERROR_CODE as ERROR_CODE_KC } from '../thirdparty/keycloak/error';

export const errorPrefix = 'CS';

export const ERROR_CODE: Record<string, number | string> = {
    UNKNOWN: 0,
    ...ERROR_CODE_KC,
};
