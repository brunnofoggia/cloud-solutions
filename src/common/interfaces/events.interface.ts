export interface EventsInterface {
    initialize(options?: Partial<EventsOptionsInterface>);
    _sendToQueue(name, data, options?: any);
    sendToQueue(name, data, options?: any);
    loadQueue(name, handler);
    isConnected();
}

export interface HandlerOptionsInterface {
    events?: EventsInterface;
    queueName?: string;
}

export interface EventsOptionsInterface {
    // a function must be send to load your queues under the connection estabilished
    loadQueues: any;
    // needed for specific solution without default provider options
    user?: string;
    pass?: string;
    // cloud provider region (aws, azure, gcp)
    region?: string;
    // needed for rabbitmq
    host: string;
    port?: string | number;
    // max number of messages to be retrieved in a single call
    maxNumberOfMessages?: number;
    // prefix of queue names
    prefix?: string;
    topicName?: string;
    // clear all queues (for testing purposes)
    deleteAllQueues?: number | boolean;
    // sqs features
    fifo?: boolean;
}
