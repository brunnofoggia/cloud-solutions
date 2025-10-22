import { get, isArray, pick } from 'lodash';

import { Err } from '../../common/utils/error';
import { Iam } from '../../common/abstract/iam';
import { IamInterface } from '../../common/interfaces/iam.interface';
import { KeycloakProvider, KeycloakProviderDefaultOptions } from './provider';
import { KeycloakProviderOptions, KeycloakRegisterPassword, KeyCloakRegisterRole, KeycloakRegisterUser } from './interface';
import { ERROR_CODE } from './error';

export class Keycloak extends Iam implements IamInterface {
    // #region vars, getters and setters
    defaultOptions: any = {};
    instance: any;

    protected libraries: any = {
        uuidValidate: {
            path: 'uuid',
            key: 'validate',
        },
        uuidVersion: {
            path: 'uuid',
            key: 'version',
        },
    };

    provider: KeycloakProvider;
    userInfo;
    // #endregion

    // #region initialization
    async initialize(options: Partial<KeycloakProviderOptions> = {}) {
        await super.initialize(options);
        await this.initializeProvider(options);
    }

    async initializeProvider(options: Partial<KeycloakProviderOptions> = {}) {
        this.provider = new KeycloakProvider();
        await this.provider.initialize(options);

        const validate = this.getLibrary('uuidValidate');
        const version = this.getLibrary('uuidVersion');
        this.provider.uuid = { validate, version };
    }
    // #endregion

    // #region core methods
    async checkToken(token: string): Promise<void> {
        await super.checkToken(token);
        // ensure token is valid in provider
        await this.setUserInfo(true);
    }

    async setToken(token: string) {
        this.provider.setToken(token);
        await this.checkToken(token);
    }

    readUsernameFromToken(token: string): string {
        const payload = this.readTokenPayload(token);
        return payload ? payload.preferred_username || payload.username || null : null;
    }

    readRolesFromToken(token: string): string[] {
        const payload = this.readTokenPayload(token);
        if (!payload) return [];

        const roles = get(payload, 'realm_access.roles', []);
        return isArray(roles) ? roles : [];
    }

    async authenticate(username: string, password: string) {
        const result = await this.provider.auth({ username, password });
        return this.handleAuthentication(result);
    }

    async authorize(role: string | string[], token = null) {
        if (token) await this.setToken(token);
        await this.setUserInfo();
        const roleList = isArray(role) ? role : [role + ''];
        for (const roleItem of roleList) {
            if (this.hasRole(roleItem)) return true;
        }

        return false;
    }

    getRoles() {
        return get(this.userInfo, KeycloakProviderDefaultOptions.rolesPath, []);
    }

    hasRole(role: string): boolean {
        if (!this.userInfo) throw new Err('User info is not set', ERROR_CODE.KC_USER_INFO_NOT_SET);

        const roles = this.getRoles();
        return roles.includes(role);
    }

    async refreshToken() {
        const result = await this.provider.refreshAccessToken();
        return this.handleAuthentication(result);
    }

    async handleAuthentication(result) {
        const { isAuthenticated, response } = result;
        if (!isAuthenticated) {
            throw new Err('Authentication failed', ERROR_CODE.KC_AUTHENTICATION_FAILED);
        }

        const responseData = response.data;
        const keycloakAuthData = this.provider.readResponse(response);
        return { responseData, ...keycloakAuthData };
    }
    // #endregion

    // #region user info
    async fetchUserInfo() {
        const data = (await this.provider.introspect()).data;
        return data;
    }

    async setUserInfo(replace = false) {
        if (!this.userInfo || replace) {
            this.userInfo = await this.fetchUserInfo();
            if (!this.userInfo.active) {
                throw new Err('Invalid User', ERROR_CODE.KC_USER_INVALID);
            }
        }
        return this.userInfo;
    }

    async fetchRoles(token: string = null): Promise<string[]> {
        if (token) await this.setToken(token);
        const roles = this.getRoles();

        if (!isArray(roles)) {
            throw new Err('Invalid roles', ERROR_CODE.KC_USER_INFO_NOT_SET);
        }
        return roles;
    }
    // #endregion

    // #region admin
    async registerUser(userData: KeycloakRegisterUser) {
        let response, _error;
        try {
            response = await this.provider.registerUser(userData);
        } catch (error) {
            response = error.response;
            _error = error;
        }

        const result = { ...pick(response, 'status', 'userId'), ...pick(_error, 'message', 'code') };
        return result;
    }

    async resetUserPassword(user: string, passwordData: KeycloakRegisterPassword) {
        let response, _error;
        try {
            if (!this.provider.uuidCheck(user)) {
                response = await this.provider.resetPasswordByUserName(user, passwordData);
            } else {
                response = await this.provider.resetPasswordByUserId(user, passwordData);
            }
        } catch (error) {
            response = error.response;
            _error = error;
        }

        const result = { ...pick(response, 'status'), ...pick(_error, 'message', 'code') };
        return result;
    }

    async addRoleToUser(user: string, roleData: KeyCloakRegisterRole[]) {
        let response, _error;
        try {
            if (!this.provider.uuidCheck(user)) {
                response = this.provider.registerRoleByNameToUserName(user, roleData);
            } else {
                response = this.provider.registerRoleByNameToUserId(user, roleData);
            }
        } catch (error) {
            response = error.response;
            _error = error;
        }

        const result = { ...pick(response, 'status'), ...pick(_error, 'message', 'code') };
        return result;
    }
    // #endregion
}
