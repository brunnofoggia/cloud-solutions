import { Interface as ReadLineInterface } from 'readline';

export interface ReadStreamOptions {
    basePath: string;
    getRawStream: boolean;
    [x: string]: any;
}

export interface StorageInterface {
    initialize(options?: any);
    readContent(path, options?);
    readStream(path, options?: Partial<ReadStreamOptions>): Promise<ReadLineInterface | NodeJS.ReadableStream>;
    sendStream(path, options?);
    _sendContent(path, content, options?);
    sendContent(path, content, options?, retry?);
    deleteFile(path, options?);
    deleteDirectory(directoryName, options?);
    readDirectory(directoryName?, options?): Promise<any[]>;
    getDirectoryContentLength(directoryName?, options?): Promise<number>;
    checkDirectoryContentLength(directoryName?, options?): Promise<boolean>;
    // TODO: alias [to be removed]
    checkDirectoryExists(directoryName?, options?): Promise<boolean>;
    createDirIfNotExists(path: string);
}
