import { KeycloakProviderOptions } from '../../thirdparty/keycloak/interface';

export interface IamInterface {
    initialize(options?: Partial<IamOptionsInterface> | Partial<KeycloakProviderOptions>): Promise<void>;
    setToken(token: string): void;
    authenticate(username: string, password: string): Promise<IamResponse>;
    authorize(role: string, token?: string): Promise<boolean>;
    fetchRoles(token?: string): Promise<string[]>;
}

export interface IamOptionsInterface {}

export interface IamResponse {
    responseData: any;
    accessToken: string;
    expiresIn: number;
}
