export interface StorageInterface {
    initialize(options: any);
    readContent(path);
    readStream(path);
    _sendContent(path, content);
    sendContent(path, content, retry?);
    deleteDirectory(directoryName);
}