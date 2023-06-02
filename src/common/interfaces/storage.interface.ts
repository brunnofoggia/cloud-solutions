export interface StorageInterface {
    initialize(options?: any);
    readContent(path, options?);
    readStream(path, options?);
    _sendContent(path, content, options?);
    sendContent(path, content, options?, retry?);
    deleteDirectory(directoryName, options?);
    readDirectory(directoryName, options?);
    checkDirectoryExists(directoryName, options?);
}