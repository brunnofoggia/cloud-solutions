import { chain, map } from 'lodash';

const errorPrefix = 'AUTH';

enum ERROR_LIST {
    AUTH_TOKEN_EMPTY,
    AUTH_TOKEN_INVALID,
    AUTH_TOKEN_EXPIRED,
}

type errorListType = keyof typeof ERROR_LIST;

const ERROR_CODE: Record<errorListType, number | string> = {} as never;
for (const [value, name] of Object.entries(ERROR_LIST)) {
    if (isNaN(Number(value))) continue;
    ERROR_CODE[name as errorListType] = [errorPrefix, value + ''].join('_');
}

export { ERROR_CODE };
