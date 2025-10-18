import { get, isArray } from 'lodash';

import { Err } from '../../common/utils/error';
import { Iam } from '../../common/abstract/iam';
import { IamInterface } from '../../common/interfaces/iam.interface';
import { KeycloakProvider, KeycloakProviderDefaultOptions } from './provider';
import { KeycloakProviderOptions } from './interface';
import { ERROR_CODE } from './error';

export class Keycloak extends Iam implements IamInterface {
    // #region vars, getters and setters
    defaultOptions: any = {};
    instance: any;

    protected libraries: any = {};

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
    }
    // #endregion

    // #region core methods
    setToken(token: string) {
        this.checkToken(token);
        this.provider.setToken(token);
        this.userInfo = null;
    }

    async authenticate(username: string, password: string) {
        const result = await this.provider.auth({ username, password });
        return this.handleAuthentication(result);
    }

    async authorize(role, token = null) {
        if (token) {
            this.setToken(token);
        }
        await this.setUserInfo();
        return this.hasRole(role);
    }

    getRoles() {
        return get(this.userInfo, KeycloakProviderDefaultOptions.rolesPath, []);
    }

    hasRole(role: string): boolean {
        console.log('user info:', this.userInfo);
        if (!this.userInfo) throw new Err('User info is not set', ERROR_CODE.KC_USER_INFO_NOT_SET);

        const roles = this.getRoles();
        console.log('User roles:', roles);
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
        console.log('User info data:', data);
        return data;
    }

    async setUserInfo() {
        if (!this.userInfo) {
            this.userInfo = await this.fetchUserInfo();
            if (!this.userInfo.active) {
                throw new Err('Invalid Token', ERROR_CODE.KC_TOKEN_INVALID);
            }
        }
        return this.userInfo;
    }

    async fetchRoles(token: string = null): Promise<string[]> {
        if (token) this.setToken(token);
        await this.setUserInfo();
        const roles = this.getRoles();

        if (!isArray(roles)) {
            throw new Err('Invalid roles', ERROR_CODE.KC_USER_INFO_NOT_SET);
        }
        return roles;
    }
    // #endregion
}
