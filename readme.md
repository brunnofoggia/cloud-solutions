# Cloud solutions factory

This project is meant to ease the pain of migrating from one solution to another and also to ease local tests by providing equivalent solutions for local tests.

## Changelog

* Version 1.2
    * Solutions mapped
        * Events
        * Storage
        * Secrets

    * Factories available
        * Events: AWS.SQS, RabbitMQ
        * Storage: AWS.S3, Local.FS
        * Secrets: AWS.ParameterStore, Local.Env

## Usage instructions

### Recommendation

* Make use of dotenv library with .env file to map your config variables

### Configuration

Sample explained

```
import { SolutionsFactory, EventsInterface, SolutionsInterface } from 'cloud-solutions-factory';
import { myqueue } from './queues/myqueue';

// 📐 your variable that will hold factory instance
let _solutions;

export const configFactory = async () => {
    // 📐 make sure to configure only once
    if (_solutions) return;

    _solutions = new SolutionsFactory();
    // 📐 set what libraries you wanna use
    const { storage, secrets, events } = await _solutions.initialize({
        // 📐 will be set at first getting all solutions from that provider
        provider: process.env.CLOUD_PROVIDER,
        // 📐 the solutions specified below will replace the provider default
        // 📐 event management
        events: process.env.QUEUE_PROVIDER,
        // 📐 secret management
        secrets: process.env.SECRETS_PROVIDER,
        // 📐 file storage
        storage: process.env.STORAGE_PROVIDER,
        // 📐 provider options like region and access keys
        providerOptions: {
            region: process.env.AWS_REGION,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
    });

    // 📐 initialize libs is needed to set their options

    // 📐 s3 storage can receive a default bucket
    // 📐 but you can also specify the bucket when getting/putting a file
    await storage.initialize({
        Bucket: process.env.STORAGE_BUCKET,
    });

    await secrets.initialize();

    // 📐 rabbitmq needs connection parameters
    await events.initialize({
        host: process.env.QUEUE_HOST,
        port: process.env.QUEUE_PORT,
        user: process.env.QUEUE_USER,
        pass: process.env.QUEUE_PASSWORD,
        // 📐 a function must be send to load your queues under the connection estabilished
        loadQueues,
    });
};

// 📐 this function is going to instantiate the factory and set it's options at the first call
// 📐 and return the solutions
export const getSolutions = async (): Promise<SolutionsInterface> => {
    await configFactory();
    return _solutions.getAll();
};

// 📐 this function is going to load queues every time a connection is estabilished
const loadQueues = async (events: EventsInterface) => {
    events.loadQueue(myqueue.name, myqueue.handler);
};
```