import {
    mockFilePath,
    mockFileContent,
    mockDir,
    mockDirContentList,
    mockSubdir,
    mockFileStreamPath,
    mockFileStreamContent,
    mockSubdirFileName,
} from '@test/mocks/storage.mock';
import { sleep } from '../utils';

const toBeDefined: any = {};
toBeDefined.storage = (storage) => {
    expect(storage).toBeDefined();
};

const checkOptions: any = {};
checkOptions.shouldBeValid = (storage) => {
    const value = storage.checkOptions();
    expect(value).toBeTruthy();
};
checkOptions.shouldThrowError = async (StorageClass) => {
    const storage = new StorageClass({});
    await expect(async () => storage.checkOptions()).rejects.toThrow();
};

const getInstance: any = {};
getInstance.shouldBeInstanceOf = (storage, reference) => {
    const instance = storage.getInstance();
    expect(instance).toBeInstanceOf(reference);
};

const createInstance: any = {};
createInstance.shouldBeInstanceOf = (storage, reference) => {
    const instance = storage.createInstance();
    expect(instance).toBeInstanceOf(reference);
};

const sendContent: any = {};
sendContent.uploadFile = async (storage) => {
    await expect(storage.sendContent(mockFilePath, mockFileContent)).resolves.toBeUndefined();
};
sendContent.uploadFileIntoSubDirectory = async (storage) => {
    const _path = [mockDir, mockSubdir, mockSubdirFileName].join('/');
    await expect(storage.sendContent(_path, mockFileContent)).resolves.toBeUndefined();
};

const readContent: any = {};
readContent.shouldMatchContent = async (storage) => {
    const value = await storage.readContent(mockFilePath);
    expect(value).toEqual(mockFileContent);
};
readContent.shouldThrowErrorForUnexistentFile = async (storage) => {
    await expect(storage.readContent('unexistent')).rejects.toThrow();
};

const sendStream: any = {};
sendStream.shouldReturnInstanceOfWriteStream = async (storage, reference) => {
    const stream = storage.sendStream(mockFileStreamPath);
    expect(stream).toBeInstanceOf(reference);
};
sendStream.shouldSendContent = async (storage) => {
    const stream = storage.sendStream(mockFileStreamPath);
    await stream.write(mockFileStreamContent);
    await stream.end();
    // gcp takes some seconds to list file after send it from stream
    await sleep(3000);
    expect(true).toEqual(true);
};

const readStream: any = {};
readStream.shouldReturnInstanceOfInterface = async (storage, reference) => {
    const stream = await storage.readStream(mockFileStreamPath);
    expect(stream).toBeInstanceOf(reference);
};
readStream.shouldMatchContent = async (storage) => {
    const stream = await storage.readStream(mockFileStreamPath);
    let content = '';
    let firstLine = true;
    for await (const line of stream) {
        const breakLine = firstLine ? '' : '\n';
        content += breakLine + line;
        firstLine = false;
    }

    expect(content).toEqual(mockFileStreamContent);
};

const readDirectory: any = {};
readDirectory.shouldHaveContent = async (storage) => {
    const contentList = await storage.readDirectory();
    expect(contentList.length).toBeGreaterThan(0);
};
readDirectory.shouldMatchContentList = async (storage) => {
    const contentList = await storage.readDirectory(mockDir);
    expect(contentList).toEqual(mockDirContentList);
};
readDirectory.shouldHaveNothing = async (storage) => {
    const contentList = await storage.readDirectory('unexistent');
    expect(contentList).toEqual([]);
};

const getDirectoryContentLength: any = {};
getDirectoryContentLength.shouldHaveSomethingIntoRootdir = async (storage) => {
    const value = await storage.getDirectoryContentLength();
    expect(value).toBeGreaterThan(0);
};
getDirectoryContentLength.shouldHaveSomethingIntoDir = async (storage) => {
    const value = await storage.getDirectoryContentLength(mockDir);
    expect(value).toBeGreaterThan(0);
};
getDirectoryContentLength.shouldHaveNothingIntoUnexistentDirectory = async (storage) => {
    const value = await storage.getDirectoryContentLength('unexistent');
    expect(value).toEqual(0);
};

const checkDirectoryContentLength: any = {};
checkDirectoryContentLength.shouldExistRootdir = async (storage) => {
    const result = await storage.checkDirectoryContentLength();
    expect(result).toBeTruthy();
};
checkDirectoryContentLength.shouldExistDir = async (storage) => {
    const result = await storage.checkDirectoryContentLength(mockDir);
    expect(result).toBeTruthy();
};
checkDirectoryContentLength.shouldNotExist = async (storage) => {
    const result = await storage.checkDirectoryContentLength('unexistent');
    expect(result).toBeFalsy();
};

const deleteFile: any = {};
deleteFile.shouldDo = async (storage) => {
    await storage.deleteFile(mockFilePath);
    await expect(storage.readContent(mockFilePath)).rejects.toThrow();
};

const deleteDirectory: any = {};
deleteDirectory.shouldDeleteRecursively = async (storage) => {
    const _path = [mockDir + '/'].join('/');
    await storage.deleteDirectory(_path);
    expect(await storage.checkDirectoryExists(mockDir)).toBeFalsy();
};
deleteDirectory.shouldOmitDeletionOfUnexistentDirectory = async (storage) => {
    const _path = [mockDir, mockSubdir + '/'].join('/');
    await storage.deleteDirectory(_path);
    expect(await storage.checkDirectoryExists(mockDir)).toBeFalsy();
};

export {
    checkDirectoryContentLength,
    checkOptions,
    createInstance,
    deleteDirectory,
    deleteFile,
    getDirectoryContentLength,
    getInstance,
    readContent,
    readDirectory,
    readStream,
    sendContent,
    sendStream,
    toBeDefined,
};
