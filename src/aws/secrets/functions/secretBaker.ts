
import fs from "fs";
import path from "path";
import { decryptSecretData } from './kms.js';
import { serverless } from './secretBakerServerless.js';
import SecretBaker from 'serverless-secret-baker';

export const findSecretData = async function (secretName) {
    const secretsFilePath = path.join(
        './', // LAMBDA_TASK_ROOT,
        "secret-baker-secrets.json"
    );
    const file = fs.readFileSync(secretsFilePath);
    const secrets = JSON.parse(file.toString());
    return await decryptSecretData(secrets[secretName]["ciphertext"], secrets[secretName]["arn"]);
};

export const writeSecretToFile = async function (fileName = 'serverless.yml') {
    await serverless.readYml(fileName);
    const secretBaker = new SecretBaker(serverless);
    await secretBaker.writeSecretToFile();
};