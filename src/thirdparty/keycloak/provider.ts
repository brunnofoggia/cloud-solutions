import { BearerApi } from 'api-link-aio';
import { AxiosResponse } from 'axios';
import { get, isPlainObject, omit, size } from 'lodash';

import { Err } from '../../common/utils/error';
import { ERROR_CODE } from './error';
import { KeycloakProviderOptions, KeycloakResponse } from './interface';

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
    clientId: string;
    clientSecret: string;
    authGrantType: string;
    scope: string;
    authResRefreshTokenField: string;
    refreshToken: string;

    _defaultHeaders: any = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };
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
        this.baseUrl = this.buildBaseUrl(options.baseUrl, options.realm);
        this.clientId = options.clientId;
        this.clientSecret = options.clientSecret;

        // Optional
        this.authPath = this.buildAuthUrl(options.authPath);
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

    authReqOptionBody(): any {
        const body: any = {
            ...this.authClientReqOptionBody(),
            grant_type: this.authGrantType,
            scope: this.scope,
            ...super.authReqOptionBody(),
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
    buildBaseUrl(baseUrl: string, realm: string) {
        return [baseUrl, 'realms', realm].join('/');
    }

    buildAuthUrl(authPath = '') {
        return authPath || KeycloakProviderDefaultOptions.authPath;
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
        const body: any = {
            ...omit(this.authBuildReqOptions(), 'scope'),
            grant_type: KeycloakProviderDefaultOptions.refreshGrantType,
            refresh_token: this.refreshToken,
            url: this.authPath,
        };

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
}
