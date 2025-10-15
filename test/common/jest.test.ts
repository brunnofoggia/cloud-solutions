import { buildErrorCode } from '../../src/common/utils/error';

declare global {
    namespace jest {
        interface Matchers<R> {
            toThrowCode(expectedCode: number | string): R;
        }
    }
}

const matchers = {
    toThrowCode: async function (received: () => void, expectedCode_: number | string) {
        try {
            if (typeof received === 'function') received();
            // common behavior like .toThrow()
            else throw received;

            return {
                pass: false,
                message: () => 'The function did not throw an error',
            };
        } catch (error) {
            const expectedCode = buildErrorCode(expectedCode_);
            if (error.code === expectedCode) {
                return {
                    pass: true,
                    message: () => `The function threw the error with the expected code (${expectedCode})`,
                };
            } else {
                return {
                    pass: false,
                    message: () =>
                        `The function threw an error, but the error code (${error.code}) does not match the expected code (${expectedCode})`,
                };
            }
        }
    },
};

export default matchers;

expect?.extend(matchers);
