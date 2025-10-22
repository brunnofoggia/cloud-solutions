import { KeycloakProviderOptions, KeycloakRegisterUser } from '../../thirdparty/keycloak/interface';

export interface IamInterface {
    initialize(options?: Partial<IamOptionsInterface> | Partial<KeycloakProviderOptions>): Promise<void>;
    setToken(token: string): void;
    checkToken(token: string): void;
    readUsernameFromToken(token: string): string;
    readRolesFromToken(token: string): string[];
    authenticate(username: string, password: string): Promise<IamResponse>;
    authorize(role: string, token?: string): Promise<boolean>;
    fetchRoles(token?: string): Promise<string[]>;
    registerUser(userData: any): Promise<any>;
    resetUserPassword(user: string, passwordData: any): Promise<any>;
    addRoleToUser(user: string, roleData: any[]): Promise<any>;
}

export interface IamOptionsInterface {}

export interface IamResponse {
    responseData: any;
    accessToken: string;
    expiresIn: number;
}
