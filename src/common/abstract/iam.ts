import jwt from 'jsonwebtoken';

import { Solution } from './solution';
import { Err } from '../utils/error';
import { ERROR_CODE } from '../error/iam.error';

export const IamDefaultOptions = {};

export abstract class Iam extends Solution {
    public defaultOptions: any = IamDefaultOptions;

    checkToken(token: string): void {
        const hasContent = !!token && token.trim().length > 0;
        if (!hasContent) throw new Err('Token is empty', ERROR_CODE.AUTH_TOKEN_EMPTY);

        const payload = this.readTokenPayload(token);
        if (!payload) throw new Err('Invalid token', ERROR_CODE.AUTH_TOKEN_INVALID);

        const isExpired = this.checkPayloadIsExpired(payload);
        if (isExpired) throw new Err('Token is expired', ERROR_CODE.AUTH_TOKEN_EXPIRED);
    }

    readTokenPayload(token: string): any {
        try {
            const payload = jwt.decode(token);
            return payload;
        } catch (error) {
            console.log('Error decoding JWT:', error.message);
            return null;
        }
    }

    checkPayloadIsExpired(payload: any): boolean {
        try {
            const currentTime = Date.now();
            const exp = (!payload.exp && payload.exp !== 0) || isNaN(payload.exp) ? null : payload.exp;
            if (exp === null) return true; // No expiration claim means the token does not expire
            const expTime = exp * 1000; // Convert to milliseconds

            return expTime < currentTime;
        } catch (error) {
            console.log('Error decoding JWT:', error.message);
            return true; // If decoding fails, consider the token as expired
        }
    }
}
