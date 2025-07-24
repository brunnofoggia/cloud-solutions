export const decryptSecretData = async function (cipher, arn, AWS) {
    const kms = new AWS.KMS();
    const params = {
        CiphertextBlob: Buffer.from(cipher, 'base64'),
        EncryptionContext: { PARAMETER_ARN: arn },
    };
    const response = await kms.decrypt(params).promise();
    return response.Plaintext.toString('ascii');
};
