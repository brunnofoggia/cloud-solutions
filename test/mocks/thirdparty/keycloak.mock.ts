//
const headers = {
    'Content-Type': 'application/json',
} as never;

export const mockAuthenticated = {
    data: {
        access_token:
            'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJuQVhaV2l0SzNWMVdLNEFqWlMyd3lQZ0hmZDhJVWpJX2V0alpNb0xONjZJIn0.eyJleHAiOjE3NjAxMjg1NjUsImlhdCI6MTc2MDEyODI2NSwianRpIjoiODA0MjYyMzctNGQ2MS00NjdjLTk0YzctYjY5YjFkNzdhNzk5IiwiaXNzIjoiaHR0cHM6Ly9hdXRoLmhtbC5jYnlrLmNvbS9yZWFsbXMvYmF1ay1teC1obWwiLCJhdWQiOlsicmVhbG0tbWFuYWdlbWVudCIsImFjY291bnQiXSwic3ViIjoiZDdiYTE1MmQtYjM5Ny00MGM2LTljZTQtMTNlNTNmMzc1YjA4IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoibXgtYXBpIiwic2lkIjoiNDM5YjM4Y2MtYzQ5Ni00Nzk4LWJjMTQtYTE1NjUwN2MzNzZlIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIvKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsibTAiLCJidXNpbmVzcyIsIm9mZmxpbmVfYWNjZXNzIiwiZGVmYXVsdC1yb2xlcy1iYXVrLW14LWhtbCIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsicmVhbG0tbWFuYWdlbWVudCI6eyJyb2xlcyI6WyJ2aWV3LWlkZW50aXR5LXByb3ZpZGVycyIsInZpZXctcmVhbG0iLCJtYW5hZ2UtaWRlbnRpdHktcHJvdmlkZXJzIiwiaW1wZXJzb25hdGlvbiIsInJlYWxtLWFkbWluIiwiY3JlYXRlLWNsaWVudCIsIm1hbmFnZS11c2VycyIsInF1ZXJ5LXJlYWxtcyIsInZpZXctYXV0aG9yaXphdGlvbiIsInF1ZXJ5LWNsaWVudHMiLCJxdWVyeS11c2VycyIsIm1hbmFnZS1ldmVudHMiLCJtYW5hZ2UtcmVhbG0iLCJ2aWV3LWV2ZW50cyIsInZpZXctdXNlcnMiLCJ2aWV3LWNsaWVudHMiLCJtYW5hZ2UtYXV0aG9yaXphdGlvbiIsIm1hbmFnZS1jbGllbnRzIiwicXVlcnktZ3JvdXBzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJCcnVubyBGb2dnaWEiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJicnVuby5mb2dnaWFAYmF1ay5jb20uYnIiLCJnaXZlbl9uYW1lIjoiQnJ1bm8iLCJmYW1pbHlfbmFtZSI6IkZvZ2dpYSIsImVtYWlsIjoiYnJ1bm8uZm9nZ2lhQGJhdWsuY29tLmJyIn0.bTuksRjCdXofyOy9tKpDV6Yuu2kSVCjO-287mQewPViL4zQT65UxuWxApe0pvGgK7ZPNMgkdyz9aSZGo-l7CnvBJIUaYQrspFne9iJ97sMkAZvASeX3lfbAcB3cS4kOMi2tzTA_XvZ6kXMc-AU_87WShlLsF2FOcrQbxvi28JChGT4fAQWL-ESVILyA8NN5HcYZVhmJDQQ_RqcViQ6pfC5Yc-GTc-G2evY09ByLZ6POZatoSZIBMDkuh8x3l9KZdV6VxZxPum0Ull1Omc5gS9VzGPvpFL4OweDBjxh5pTt1-gN-5ubHhjYO9eJzmsBB40paAKcI9qWcYgtZLgkSuTA',
        expires_in: 300,
        refresh_expires_in: 1800,
        refresh_token:
            'eyJhbGciOiJIUzUxMiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJjNGExODkyOS01NGE1LTQ2YWEtYjNmNy03NmMxYThiOTRhOTEifQ.eyJleHAiOjE3NjAxMzAwNjUsImlhdCI6MTc2MDEyODI2NSwianRpIjoiZDBmMGUxNzUtZjY4My00NGZmLThhZDUtNjYzYjQxYzVlNzAzIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLmhtbC5jYnlrLmNvbS9yZWFsbXMvYmF1ay1teC1obWwiLCJhdWQiOiJodHRwczovL2F1dGguaG1sLmNieWsuY29tL3JlYWxtcy9iYXVrLW14LWhtbCIsInN1YiI6ImQ3YmExNTJkLWIzOTctNDBjNi05Y2U0LTEzZTUzZjM3NWIwOCIsInR5cCI6IlJlZnJlc2giLCJhenAiOiJteC1hcGkiLCJzaWQiOiI0MzliMzhjYy1jNDk2LTQ3OTgtYmMxNC1hMTU2NTA3YzM3NmUiLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIHJvbGVzIGJhc2ljIGFjciB3ZWItb3JpZ2lucyBlbWFpbCBzZXJ2aWNlX2FjY291bnQifQ._RazcQ7E5oXGhj5vHSnz6GJc2e4CpnUDponJHLuhbNgksqAPDJrEG1JNEWtuMEUX_bf6YbsH7r2Ka-YQZ4mOsw',
        token_type: 'Bearer',
        id_token:
            'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJuQVhaV2l0SzNWMVdLNEFqWlMyd3lQZ0hmZDhJVWpJX2V0alpNb0xONjZJIn0.eyJleHAiOjE3NjAxMjg1NjUsImlhdCI6MTc2MDEyODI2NSwianRpIjoiNWQ1YmFmNTctNGQwNC00MzY5LWE1YjItZTNlYjA4MWY4YjEyIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLmhtbC5jYnlrLmNvbS9yZWFsbXMvYmF1ay1teC1obWwiLCJhdWQiOiJteC1hcGkiLCJzdWIiOiJkN2JhMTUyZC1iMzk3LTQwYzYtOWNlNC0xM2U1M2YzNzViMDgiLCJ0eXAiOiJJRCIsImF6cCI6Im14LWFwaSIsInNpZCI6IjQzOWIzOGNjLWM0OTYtNDc5OC1iYzE0LWExNTY1MDdjMzc2ZSIsImF0X2hhc2giOiJib25OZkpFR0lFSG1sMkp2ckpCWjFnIiwiYWNyIjoiMSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiQnJ1bm8gRm9nZ2lhIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiYnJ1bm8uZm9nZ2lhQGJhdWsuY29tLmJyIiwiZ2l2ZW5fbmFtZSI6IkJydW5vIiwiZmFtaWx5X25hbWUiOiJGb2dnaWEiLCJlbWFpbCI6ImJydW5vLmZvZ2dpYUBiYXVrLmNvbS5iciJ9.LEfdMPYjsXgslZ7_ki1lZAwsAUAgaNBPeA6BrU6d8GDOdpU-r9VVub-ltLy69psMZlu9bSQceXb3jkVF6MWNlFi25JvcHuP9yesQnz-8gAmkR5SsmiIhOWApGjRRlFgjhK8DUC8KDR0q_Qnhhi-GVsuLSLndjrt_ugTlIP4IK7iCs7FWWM7HpIopAWgMcquJdPghdW894xfVPmoksQdb_bOesv82NsrBuND_yJjgZrCsy8JrSBIrmBdr5BaVk2IFl8IB80uBYsT87sCCE5hDSZm4hClqqkJM703N1yUUg7plB6WJ2_CVhsphia4MAVbE-FziovxKgfJTJrnjw8Rb7A',
    },
    headers,
    status: 200,
    statusText: 'OK',
    request: {},
    config: {
        headers,
    },
};

export const mockAuthenticatedAgain = {
    data: {
        ...mockAuthenticated.data,
        access_token:
            'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJuQVhaV2l0SzNWMVdLNEFqWlMyd3lQZ0hmZDhJVWpJX2V0alpNb0xONjZJIn0.eyJleHAiOjE3NjExODMyOTcsImlhdCI6MTc2MTE0MDA5NywianRpIjoiODdkNDljMGUtYzQ1YS00NTM1LWI1ZmUtZTA5MTA2NzMyZTk5IiwiaXNzIjoiaHR0cHM6Ly9hdXRoLmhtbC5jYnlrLmNvbS9yZWFsbXMvYmF1ay1teC1obWwiLCJhdWQiOlsicmVhbG0tbWFuYWdlbWVudCIsImFjY291bnQiXSwic3ViIjoiZDdiYTE1MmQtYjM5Ny00MGM2LTljZTQtMTNlNTNmMzc1YjA4IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoibXgtYXBpIiwic2lkIjoiNzA0YWI5MjItNDI0Yy00NzhjLTk2MTYtMDAwOWYzODhjYjcyIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIvKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsibTAiLCJidXNpbmVzcyIsIm14X2FkbWluIiwib2ZmbGluZV9hY2Nlc3MiLCJkZWZhdWx0LXJvbGVzLWJhdWstbXgtaG1sIiwidW1hX2F1dGhvcml6YXRpb24iLCJwb3J0YWwiXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctaWRlbnRpdHktcHJvdmlkZXJzIiwidmlldy1yZWFsbSIsIm1hbmFnZS1pZGVudGl0eS1wcm92aWRlcnMiLCJpbXBlcnNvbmF0aW9uIiwicmVhbG0tYWRtaW4iLCJjcmVhdGUtY2xpZW50IiwibWFuYWdlLXVzZXJzIiwicXVlcnktcmVhbG1zIiwidmlldy1hdXRob3JpemF0aW9uIiwicXVlcnktY2xpZW50cyIsInF1ZXJ5LXVzZXJzIiwibWFuYWdlLWV2ZW50cyIsIm1hbmFnZS1yZWFsbSIsInZpZXctZXZlbnRzIiwidmlldy11c2VycyIsInZpZXctY2xpZW50cyIsIm1hbmFnZS1hdXRob3JpemF0aW9uIiwibWFuYWdlLWNsaWVudHMiLCJxdWVyeS1ncm91cHMiXX0sImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6IkJydW5vIEZvZ2dpYSIsInByZWZlcnJlZF91c2VybmFtZSI6ImJydW5vLmZvZ2dpYUBiYXVrLmNvbS5iciIsImdpdmVuX25hbWUiOiJCcnVubyIsImZhbWlseV9uYW1lIjoiRm9nZ2lhIiwiZW1haWwiOiJicnVuby5mb2dnaWFAYmF1ay5jb20uYnIifQ.gLMexifDp8bYL4v8jWo6bcVfymoMjD1cbck2SGb9suI6dJx8XytkIzLDj3TymKIWK35nyU6dW6gvXPQKWRj8D0JRC9kfQE8YqKtxio0iboCFeqHTNGlyC_0X2WlbY-mNwU-r6ntH6fWBY4BN2_IjxRRvRY4-32_Zxyf5Ia5kMfaJuOcUJwEurngjFLT8TXHMzJI5pJrpa3IBbH9BWhbr9nP4YEHx-f_t3lNhcZDVxbJEiNzQ0s3W4TVb9QY3VynrytBOPL92KP2gWnpLzLuUlKAAU18t9EiokDnbCJgMqnvAAAB78BCw7CBFckD-S4e0XIWvYwbkkLgytI8WiWxjzg',
    },
    headers,
    status: 200,
    statusText: 'OK',
    request: {},
    config: {
        headers,
    },
};

export const mockUserInfo = {
    data: {
        exp: 1760130669,
        iat: 1760130369,
        jti: 'f6910a4e-1c43-4397-8ade-7422ee5759a6',
        aud: ['realm-management', 'account'],
        sub: 'd7ba152d-b397-40c6-9ce4-13e53f375b08',
        typ: 'Bearer',
        azp: 'mx-api',
        sid: '3d286e0d-2c77-4c48-b9c0-419f07a54d09',
        acr: '1',
        'allowed-origins': ['/*'],
        realm_access: { roles: ['m0', 'business', 'offline_access', 'default-roles-bauk-mx-hml', 'uma_authorization'] },
        scope: 'openid profile email',
        email_verified: true,
        name: 'Test Foggia',
        preferred_username: 'test.foggia@email.com.br',
        given_name: 'Bruno',
        family_name: 'Foggia',
        email: 'bruno.foggia@email.com.br',
        client_id: 'mx-api',
        username: 'bruno.foggia@email.com.br',
        aliasForTesting: 'bruno.foggia',
        token_type: 'Bearer',
        active: true,
    },
};

export const mockUserSearch = {
    id: 'd7ba152d-b397-40c6-9ce4-13e53f375b08',
    username: 'bruno.foggia@email.com.br',
};

export const mockRoleList = [
    {
        name: 'offline_access',
    },
];

export const mockRoleId = {
    id: 'ed0ad427-5044-40ab-8d9b-0b256d869eaa',
    name: 'offline_access',
};

export const mockRoleSearch = {
    id: 'ed0ad427-5044-40ab-8d9b-0b256d869eaa',
    name: 'offline_access',
    description: '${role_offline-access}',
    composite: false,
    clientRole: false,
    containerId: '82254349-583c-4f35-bd0a-2236f3317036',
    attributes: {},
};

export const mockUserRegistry = {
    username: 'user@test.com',
    email: 'user@test.com',
    firstName: 'Test',
    lastName: 'User',
    enabled: true,
    emailVerified: true,
};

export const mockUserRegistered = {
    status: 201,
    headers: {
        location: 'http://auth.hml.cbyk.com/admin/realms/bauk-mx-hml/users/d7ba152d-b397-40c6-9ce4-13e53f375b08',
    },
};

export const mockFindUserIdByUsername = {
    data: [
        {
            id: 'd7ba152d-b397-40c6-9ce4-13e53f375b08',
        },
    ],
};
