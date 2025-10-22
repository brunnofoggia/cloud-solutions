# Cloud solutions factory

This project is meant to ease the pain of migrating from one solution to another and also to ease local tests by providing equivalent local solutions.

## Changelog

* Version 4
    * Solutions mapped
        * Events
        * Storage
        * Secrets
        * Authentication

    * Factories available
        * Events: AWS: SQS, ThirdParty: RabbitMQ
        * Storage: AWS: S3, GCP: Storage, ThirdParty: SFTP, Local: FS
        * Secrets: AWS: ParameterStore, GCP: SecretManager, Local: Env
        * Authentication: AWS: Cognito (soon), ThirdParty: Keycloak

## Usage

The core feature here is to use the abstract factory to provide the solutions you want to use by setting configurations accordingly. You can use only one solution, like storage, or all of them each one from a different provider. Every combination
works just fine.

### Recommendation

I personally use dotenv library with .env file to map config variables and on some cases secrets into cloud

### Configuration

#### 1. How to use a single solution

This is the way you should implement so you can change storage provider just by changing environment variables when needed. 

```javascript
import { SolutionsFactory, StorageInterface } from 'cloud-solutions-factory';

export const getStorage = async (): Promise<StorageInterface> => {
    // instantiate the factory
    const solutions = new SolutionsFactory();
    // describe what solutions you need
    const { storage } = await solutions.initialize({
        storage: process.env.STORAGE_PROVIDER,
        // provider options are optional if you specify everything on each solution
        // when you are using only one solution is simpler to set them after into solution "initialize" method
        providerOptions: {}
    });

    // configure what functionalities you need
    const { storage } = await solutions.initialize({
        storage: process.env.STORAGE_PROVIDER,
    });

    // s3 storage must receive the name of the bucket
    await storage.initialize({
        // provider options
        region: process.env.CLOUD_REGION,
        user: process.env.CLOUD_USER,
        pass: process.env.CLOUD_PASS,
        // bucket name
        Bucket: process.env.STORAGE_BUCKET,
    });

    return storage;
};

```

#### 2. How to use multiple solutions

Sample explained by a simple linear code: 

```javascript
import { SolutionsFactory, EventsInterface, SolutionsInterface } from 'cloud-solutions-factory';
import { queuehandler } from './queues/handler';

// your variable that will hold factory instance
let _solutions;

export const configFactory = async () => {
    // make sure to configure only once
    if (_solutions) return;

    _solutions = new SolutionsFactory();

    // configure what functionalities you need
    const { storage, secrets, events } = await _solutions.initialize({
        // provider defines all default solutions from same cloud, but after you can specify if any are different
        provider: process.env.CLOUD_PROVIDER,
        // the solutions specified below will replace the provider default. they are optional if you use everything from a unique cloud provider
        // events management
        events: process.env.QUEUE_PROVIDER,
        // secrets management
        secrets: process.env.SECRETS_PROVIDER,
        // file storage
        storage: process.env.STORAGE_PROVIDER,
        // provider options like region and access keys
        providerOptions: {
            user: process.env.CLOUD_USER,
            pass: process.env.CLOUD_PASS,
            region: process.env.CLOUD_REGION, // aws/gcp only
            project: process.env.CLOUD_PROJECT, // gcp only
        }
    });

    // initialize libs is needed to set their options

    // s3 storage can receive a default bucket
    // but you can also specify the bucket when reading or sending a directory or file
    await storage.initialize({
        Bucket: process.env.STORAGE_BUCKET,
    });

    await secrets.initialize();

    // rabbitmq needs connection parameters
    await events.initialize({
        host: process.env.QUEUE_HOST,
        port: process.env.QUEUE_PORT,
        user: process.env.QUEUE_USER,
        pass: process.env.QUEUE_PASSWORD,
        // a function must be send to load your queues under the connection estabilished
        loadQueues,
    });
};

// this function is going to instantiate the factory and set it's options
export const loadSolutions = async (): Promise<void> => {
    await configFactory();
};

// and return the solutions
export const getSolutions = (): SolutionsInterface => {
    return _solutions.getAll();
};

// this function is going to load queues every time a connection is estabilished
const loadQueues = async (events: EventsInterface) => {
    events.loadQueue(queuehandler.name, queuehandler.handler);
};
```