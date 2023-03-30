import aws from 'aws-sdk';
import yaml from 'js-yaml';
import fs from 'fs/promises';

const providers = {
    aws: {
        provider: aws,
        async request(serviceClass, methodName, parameters) { // , options
            const service = new this.provider[serviceClass]({ region: aws.config.region });
            const parameterPromise = service[methodName](parameters).promise();

            return await parameterPromise;
        }
    }
};

export const serverless = {
    getProvider(provider) {
        return providers[provider];
    },
    service: {
        custom: {
            secretBaker: {
                //... importar do .yml
            },
        },
        package: {
            // include: []
        }
    },
    classes: {
        Error: Error,
    },
    cli: {
        log(message) {
            console.log(message);
        }
    },
    async readYml(fileName = 'serverless.yml') {
        const content = await fs.readFile('./' + fileName);
        // const content = await fs.readFile('@root/'+fileName, 'utf8');

        const doc = yaml.load(content);
        this.service.custom = doc.custom;
    },
    setKeys(keys) {
        this.service.custom.secretBaker = keys;
    }
};