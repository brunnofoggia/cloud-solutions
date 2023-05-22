export interface EventsInterface {
    initialize(options?: any);
    _sendToQueue(name, data);
    sendToQueue(name, data, retry?);
    loadQueue(name, handler);
}

export interface HandlerOptionsInterface {
    events?: EventsInterface,
    queueName?: string;
}