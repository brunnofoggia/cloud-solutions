import { indexOf } from 'lodash';
import { ERROR_CODE, errorPrefix } from '../../enum/error';

export type ERROR_CODE_TYPE = number | string;

export const buildErrorCode = (code: ERROR_CODE_TYPE) => {
    if ((typeof code !== 'number' && typeof code !== 'string') || code === '') {
        code = ERROR_CODE.UNKNOWN;
    }

    const position = indexOf(Object.values(ERROR_CODE), code);
    if (position !== -1 && position !== undefined) {
        return [errorPrefix, code + ''].join('-');
    }
    return code + '';
};

export class Err extends Error {
    code: string;
    constructor(message: string, code: ERROR_CODE_TYPE = ERROR_CODE.UNKNOWN) {
        super(message + '');
        this.code = buildErrorCode(code);
    }
}
