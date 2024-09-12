import { Interface as ReadLineInterface } from 'readline';

export interface ReadStreamOptions {
    basePath: string;
    getRawStream: boolean;
    [x: string]: any;
}

export interface StorageInterface {
    initialize(options?: any);
    readBinary?(path, options?);
    readContent(path, options?);
    readStream(path, options?: Partial<ReadStreamOptions>): Promise<ReadLineInterface | NodeJS.ReadableStream>;
    sendStream(path, options?);
    _sendContent(path, content, options?);
    sendContent(path, content, options?, retry?);
    deleteFile(path, options?);
    deleteDirectory(directoryName, options?);
    readDirectory(directoryName?, options?): Promise<any[]>;
    getDirectoryContentLength(directoryName?, options?): Promise<number>;
    checkPathExists(directoryName?, options?): Promise<boolean>;
    getFileInfo(path: string, options?): Promise<FileInfoInterface>;
    copyFile(pathFrom, pathTo, options?: any): Promise<void>;
    // TODO: alias [to be removed]
    checkDirectoryContentLength(directoryName?, options?): Promise<boolean>;
    checkDirectoryExists(directoryName?, options?): Promise<boolean>;
    createDirIfNotExists(path: string);
}

export interface CompareSizeOptionsInterface {
    storageA: StorageInterface;
    storageB: StorageInterface;
}

export interface FileInfoInterface {
    contentLength: number;
    etag: any;
}
