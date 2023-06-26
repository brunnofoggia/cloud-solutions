import { keys } from 'lodash';

export const mockPath = '/dev/cloud/test/aws';
export const mockSecret = 'secret value';
export const mockInvalidPath = '/dev/invalid';
export const mockParameter = {
    Name: mockPath,
    Type: 'SecureString',
    Value: mockSecret,
    DataType: 'text',
};

export const mockParameterKeys = keys(mockParameter);
