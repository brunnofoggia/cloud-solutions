import _debug from 'debug';
const debug = _debug('solutions:auth:keycloak');
import { BearerApi } from 'api-link-aio';
import { AxiosResponse } from 'axios';
import { defaultsDeep, get, isPlainObject, omit, size } from 'lodash';

import { Err } from '../../common/utils/error';
import { ERROR_CODE } from './error';
import { KeycloakProviderOptions, KeycloakRegisterPassword, KeyCloakRegisterRole, KeycloakRegisterUser, KeycloakResponse } from './interface';
import isArray from 'lodash';

export const KeycloakProviderDefaultOptions: Partial<KeycloakProviderOptions> = {
    authPath: '/protocol/openid-connect/token',
    introspectPath: 'introspect',
    authResTokenField: 'access_token',
    authResRefreshTokenField: 'refresh_token',
    authGrantType: 'password',
    refreshGrantType: 'refresh_token',
    scope: 'openid',
    rolesPath: 'realm_access.roles',
};

export class KeycloakProvider extends BearerApi {
    // #region vars, getters and setters
    adminBaseUrl: string;
    clientId: string;
    clientSecret: string;
    authGrantType: string;
    scope: string;
    authResRefreshTokenField: string;
    refreshToken: string;
    realm: string;

    uuid: { validate(value: string): boolean; version(value: string): number };

    _defaultHeaders: any = {
        'Content-Type': 'application/x-www-form-urlencoded',
        // 'Content-Type': 'application/json;charset=UTF-8',
    };

    _adminDefaultHeaders: any = {
        'Content-Type': 'application/json;charset=UTF-8',
    };

    authReqOptionHeaders(): any {
        return {
            'Content-Type': 'application/x-www-form-urlencoded',
        };
    }
    // #endregion

    // #region core setup
    async initialize(...args) {
        await super.initialize();
        this.prepareInitializeOptions(args);
    }

    prepareInitializeOptions(args: any[]) {
        const options = (args[0] || {}) as KeycloakProviderOptions;
        if (!options || !isPlainObject(options) || size(options) === 0) {
            throw new Err('No options provided', ERROR_CODE.KC_NO_OPTIONS_PROVIDED);
        }
        this.checkIntegrationOptions(options);
        this.setupIntegration(options);
        return options;
    }

    setupIntegration(options: KeycloakProviderOptions) {
        this.realm = options.realm;
        this.baseUrl = options.baseUrl;
        this.adminBaseUrl = options.adminBaseUrl;
        this.clientId = options.clientId;
        this.clientSecret = options.clientSecret;

        // Optional
        this.authPath = this.buildAuthPath(options.authPath);
        this.authResTokenField = options.authResTokenField || KeycloakProviderDefaultOptions.authResTokenField;
        this.authResRefreshTokenField = options.authResRefreshTokenField || KeycloakProviderDefaultOptions.authResRefreshTokenField;
        this.authGrantType = options.authGrantType || KeycloakProviderDefaultOptions.authGrantType;
        this.scope = options.scope || KeycloakProviderDefaultOptions.scope;

        this.setToken(options?.token || '');
    }

    checkIntegrationOptions(options: KeycloakProviderOptions) {
        if (!options.baseUrl) {
            throw new Err('Base URL is required', ERROR_CODE.KC_EMPTY_BASE_URL);
        }
        if (!options.adminBaseUrl) {
            throw new Err('Admin Base URL is required', ERROR_CODE.KC_EMPTY_ADMIN_BASE_URL);
        }
        if (!options.realm) {
            throw new Err('Realm is required', ERROR_CODE.KC_EMPTY_REALM);
        }
        if (!options.clientId) {
            throw new Err('Client ID is required', ERROR_CODE.KC_EMPTY_CLIENT_ID);
        }
        if (!options.clientSecret) {
            throw new Err('Client Secret is required', ERROR_CODE.KC_EMPTY_CLIENT_SECRET);
        }
    }

    authClientReqOptionBody(): any {
        const body: any = {
            client_id: this.clientId,
            client_secret: this.clientSecret,
        };

        return body;
    }

    authReqOptionBody(options: any): any {
        const body: any = {
            ...this.authClientReqOptionBody(),
            grant_type: this.authGrantType,
            scope: this.scope,
            ...super.authReqOptionBody(options),
        };

        return body;
    }
    // #endregion

    // #region response
    readResponse(response: AxiosResponse): KeycloakResponse {
        const data = response.data;
        const result: any = {
            expiresIn: get(data, 'expires_in', 0),
            refreshExpiresIn: get(data, 'refresh_expires_in', 0),
            tokenType: get(data, 'token_type', ''),
            sessionState: get(data, 'session_state', ''),
            scope: get(data, 'scope', ''),
        };
        result.accessToken = get(data, this.authResTokenField);
        result.refreshToken = get(data, this.authResRefreshTokenField);

        return result as KeycloakResponse;
    }
    // #endregion

    // #region urls
    getRequestBasePath() {
        return this.buildBaseUrl(this.baseUrl, this.realm);
    }

    buildBaseUrl(baseUrl: string, realm: string) {
        return [baseUrl, 'realms', realm].join('/');
    }

    buildAuthPath(authPath = '') {
        return authPath || KeycloakProviderDefaultOptions.authPath;
    }

    buildAdminBaseUrl(baseUrl: string, realm: string) {
        return [baseUrl, 'admin', 'realms', realm].join('/');
    }
    // #endregion

    // #region refresh token
    authResHandle(response: AxiosResponse) {
        const token = super.authResHandle(response);
        this.refreshToken = this.getRefreshTokenFromResponse(response);
        return token;
    }

    getRefreshTokenFromResponse(response: AxiosResponse) {
        return get(response.data, this.authResRefreshTokenField, '');
    }

    refreshReqOptionBody(): any {
        const body: any = defaultsDeep(
            { data: { grant_type: KeycloakProviderDefaultOptions.refreshGrantType, refresh_token: this.refreshToken, url: this.authPath } },
            omit(this.authBuildReqOptions(), 'data.scope', 'data.username', 'data.password'),
        );

        return body;
    }

    async refreshAccessToken() {
        this.debug('refreshing');
        const options = this.refreshReqOptionBody();

        const response = await this._request(options);
        this.authResHandle(response);

        return { options, isAuthenticated: this._isAuthenticated(), response };
    }
    // #endregion

    // #region user info
    buildIntrospectUrl() {
        return [this.authPath, KeycloakProviderDefaultOptions.introspectPath].join('/');
    }

    async introspect() {
        const url = this.buildIntrospectUrl();
        const data = {
            token: this.token,
            client_id: this.clientId,
            client_secret: this.clientSecret,
        };

        return this.post(url, data);
    }
    // #endregion

    // #region admin
    async searchUsersByUsername(username: string) {
        const adminUrl = this.buildAdminBaseUrl(this.adminBaseUrl, this.realm);
        const usersUrl = [adminUrl, 'users'].join('/');
        return this.get(usersUrl, { params: { username } });
    }

    async findRoleDataByName(roleName: string) {
        const adminUrl = this.buildAdminBaseUrl(this.adminBaseUrl, this.realm);
        const roleUrl = [adminUrl, 'roles', roleName].join('/');
        return this.get(roleUrl);
    }

    async registerUser(userData: KeycloakRegisterUser): Promise<AxiosResponse<any> & { userId?: string }> {
        userData.enabled = userData.enabled ?? true;

        const adminUrl = this.buildAdminBaseUrl(this.adminBaseUrl, this.realm);
        const registerUrl = [adminUrl, 'users'].join('/');
        const response: AxiosResponse<any> & { userId?: string } = await this.post(registerUrl, userData, { headers: this._adminDefaultHeaders });

        if ((response.status + '').startsWith('20')) {
            response.userId = get(response, 'headers.location', '')?.split('/')?.pop();
            const uuidCheck = this.uuidCheck(response.userId);
            if (!uuidCheck) {
                throw new Err('Invalid user ID', ERROR_CODE.KC_INVALID_USER_ID);
            }
        }

        return response;
    }

    async resetPasswordByUserId(userId: string, passwordData: KeycloakRegisterPassword) {
        const adminUrl = this.buildAdminBaseUrl(this.adminBaseUrl, this.realm);
        const passwordUrl = [adminUrl, 'users', userId, 'reset-password'].join('/');
        return this.put(passwordUrl, passwordData, { headers: this._adminDefaultHeaders });
    }

    async registerRoleByUserId(userId: string, roleData: KeyCloakRegisterRole[]) {
        const adminUrl = this.buildAdminBaseUrl(this.adminBaseUrl, this.realm);
        const roleUrl = [adminUrl, 'users', userId, 'role-mappings', 'realm'].join('/');
        return this.post(roleUrl, roleData, { headers: this._adminDefaultHeaders });
    }
    // #endregion

    // #region admin helpers
    async findUserIdByUsername(userName: string): Promise<string> {
        const userInfo = (await this.searchUsersByUsername(userName)).data;
        if (!isArray(userInfo) || userInfo.length === 0) {
            throw new Err('User not found', ERROR_CODE.KC_USER_NOT_FOUND);
        }

        const userId = userInfo[0].id;
        return userId;
    }
    async resetPasswordByUserName(userName: string, passwordData: KeycloakRegisterPassword) {
        const userId = await this.findUserIdByUsername(userName);
        return this.resetPasswordByUserId(userId, passwordData);
    }

    async registerRoleByNameToUserId(userId: string, roleData: Partial<KeyCloakRegisterRole>[]) {
        for (const role of roleData) {
            if (!role.id) {
                const roleInfo = (await this.findRoleDataByName(role.name)).data;
                role.id = roleInfo.id;
            }
        }

        return this.registerRoleByUserId(userId, roleData as KeyCloakRegisterRole[]);
    }

    async registerRoleByNameToUserName(userName: string, roleData: Partial<KeyCloakRegisterRole>[]) {
        const userId = await this.findUserIdByUsername(userName);
        return this.registerRoleByNameToUserId(userId, roleData);
    }
    // #endregion

    uuidCheck(value: string): boolean {
        try {
            if (value) {
                if (this.uuid.validate(value) && this.uuid.version(value) === 4) {
                    return true;
                }
            }
        } catch (err) {
            debug('UUID check error:', err);
        }
        return false;
    }
}
