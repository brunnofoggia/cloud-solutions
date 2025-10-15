import { chain, map } from 'lodash';

const errorPrefix = 'KC';

enum ERROR_LIST {
    KC_NO_OPTIONS_PROVIDED,
    KC_EMPTY_BASE_URL,
    KC_EMPTY_REALM,
    KC_EMPTY_CLIENT_ID,
    KC_EMPTY_CLIENT_SECRET,
    KC_AUTHENTICATION_FAILED,
    KC_USER_INFO_NOT_SET,
    KC_TOKEN_INVALID,
}

type errorListType = keyof typeof ERROR_LIST;

const ERROR_CODE: Record<errorListType, number | string> = {} as never;
for (const [value, name] of Object.entries(ERROR_LIST)) {
    if (isNaN(Number(value))) continue;
    ERROR_CODE[name as errorListType] = [errorPrefix, value + ''].join('_');
}

export { ERROR_CODE };
