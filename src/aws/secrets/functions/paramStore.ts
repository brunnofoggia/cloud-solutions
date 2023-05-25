import { serverless } from './secretBakerServerless.js';
import { decryptSecretData } from './kms.js';


export const getSecretValue = async (path) => {
    const param = await getParam(path);
    if (param?.Value && param?.ARN) {
        const data = await decryptSecretData(param.Value, param.ARN);
        return data;
    } else {
        throw new Error(`secret not found "${path}"`);
    }
};

export const getParamValue = async (path) => {
    const param = await getParam(path);
    return param?.Value;
};

export const getParam = async (path): Promise<any> => {
    serverless.setKeys({ key: path });
    return await getParameterFromSsm(path);
};

export const getParameterFromSsm = async (name) => {
    try {
        return (await serverless
            .getProvider("aws")
            .request(
                "SSM",
                "getParameter",
                {
                    Name: name,
                    WithDecryption: false
                }
            )).Parameter;
    } catch (error) {
        error.message = `"${name}": ${error.message}`;
        throw error;
    }
};