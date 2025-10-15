import { IamResponse } from '../../common/interfaces/iam.interface';

export interface KeycloakProviderOptions {
    baseUrl: string;
    authPath?: string;
    introspectPath?: string;
    realm: string;
    clientId: string;
    clientSecret: string;
    // Optional token field
    authResTokenField?: string;
    // Optional keycloak fields
    authGrantType?: string;
    refreshGrantType?: string;
    scope?: string;
    token?: string;
    authResRefreshTokenField?: string;
    rolesPath?: string;
}

export interface KeycloakResponse extends IamResponse {
    expiresIn: number;
    tokenType: string;
    sessionState: string;
    scope: string;
    refreshExpiresIn: number;
    refreshToken: string;
}
