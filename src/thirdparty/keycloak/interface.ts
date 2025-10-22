import { IamResponse } from '../../common/interfaces/iam.interface';

export interface KeycloakProviderOptions {
    baseUrl: string;
    adminBaseUrl: string;
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

export interface KeycloakRegisterUser {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    enabled: boolean;
    emailVerified: boolean;
}

export interface KeycloakRegisterPassword {
    type: string;
    temporary: boolean;
    value: string;
}

export interface KeyCloakRegisterRole {
    id: string;
    name: string;
}
