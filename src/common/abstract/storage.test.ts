import storageMock from '@test/mocks/storage.mock';
import { sleep } from '../utils';

const variables: any = {};

const detectCloudName = function (storage) {
    switch (storage.constructor.name) {
        case 'S3':
            return 'aws';
        case 'Storage':
            return 'gcp';
        case 'Fs':
            return 'local';
    }
};
const getVariables = function (storage) {
    const cloudName = detectCloudName(storage);
    if (!cloudName) throw new Error('Cloud name not detected');
    if (!variables[cloudName]) variables[cloudName] = storageMock(cloudName);
    return variables[cloudName];
};

const toBeDefined: any = {};
toBeDefined.storage = (storage) => {
    expect.assertions(1);
    expect(storage).toBeDefined();
};

const checkOptions: any = {};
checkOptions.shouldBeValid = (storage) => {
    expect.assertions(1);
    const value = storage.checkOptions();
    expect(value).toBeTruthy();
};
checkOptions.shouldThrowError = async (StorageClass) => {
    expect.assertions(1);
    const storage = new StorageClass({});
    await expect(async () => storage.checkOptions()).rejects.toThrow();
};

const getInstance: any = {};
getInstance.shouldBeInstanceOf = async (storage, reference) => {
    expect.assertions(1);
    const instance = await storage.getInstance();
    expect(instance).toBeInstanceOf(reference);
};

const createInstance: any = {};
createInstance.shouldBeInstanceOf = async (storage, reference) => {
    expect.assertions(1);
    const instance = await storage.createInstance();
    expect(instance).toBeInstanceOf(reference);
};

const sendContent: any = {};
sendContent.uploadFile = async (storage) => {
    expect.assertions(1);
    const { mockFilePath, mockFileContent } = getVariables(storage);
    await expect(storage.sendContent(mockFilePath, mockFileContent)).resolves.toBeUndefined();
};
sendContent.uploadFileIntoSubDirectory = async (storage) => {
    expect.assertions(1);
    const { mockDir, mockSubdir, mockSubdirFileName, mockFileContent } = getVariables(storage);
    const _path = [mockDir, mockSubdir, mockSubdirFileName].join('/');
    await expect(storage.sendContent(_path, mockFileContent)).resolves.toBeUndefined();
};

const readContent: any = {};
readContent.shouldMatchContent = async (storage) => {
    expect.assertions(1);
    const { mockFilePath, mockFileContent } = getVariables(storage);
    const value = await storage.readContent(mockFilePath);
    expect(value).toEqual(mockFileContent);
};
readContent.shouldThrowErrorForUnexistentFile = async (storage) => {
    expect.assertions(1);
    await expect(storage.readContent('unexistent')).rejects.toThrow();
};

const sendStream: any = {};
sendStream.shouldReturnInstanceOfWriteStream = async (storage, reference) => {
    expect.assertions(1);
    const { mockFileStreamPath } = getVariables(storage);
    const stream = await storage.sendStream(mockFileStreamPath);
    expect(stream).toBeInstanceOf(reference);
};

sendStream.shouldSendShortContent = async (storage) => {
    expect.assertions(1);
    const { mockFileStreamShortPath, mockFileStreamContent } = getVariables(storage);
    const stream = await storage.sendStream(mockFileStreamShortPath);

    await stream.writeLine(mockFileStreamContent);
    await stream.end();

    await sendStream.checkFinalContent(storage, mockFileStreamShortPath, mockFileStreamContent);
};

sendStream.shouldSendLongContent = async (storage) => {
    expect.assertions(1);
    const { mockFileStreamLongPath, mockContentLongList } = getVariables(storage);
    const stream = await storage.sendStream(mockFileStreamLongPath);

    for (const line of mockContentLongList) {
        await stream.writeLine(line);
    }
    await stream.end();
    const finalContent = mockContentLongList.join('\n');

    await sendStream.checkFinalContent(storage, mockFileStreamLongPath, finalContent);
};

sendStream.checkFinalContent = async (storage, mockFileStreamPath, finalContent) => {
    expect.assertions(1);
    const value = await storage.readContent(mockFileStreamPath);
    expect(value).toEqual(finalContent);
};

const readStream: any = {};
readStream.shouldReturnInstanceOfInterface = async (storage, reference) => {
    expect.assertions(1);
    const { mockFileStreamShortPath } = getVariables(storage);
    const stream = await storage.readStream(mockFileStreamShortPath);
    expect(stream).toBeInstanceOf(reference);
};
readStream.shouldMatchContent = async (storage) => {
    expect.assertions(1);
    const { mockFileStreamShortPath, mockFileStreamContent } = getVariables(storage);

    // wait until file is ready for read
    // await sleep(3000);
    const stream = await storage.readStream(mockFileStreamShortPath);
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
    expect.assertions(1);
    const contentList = await storage.readDirectory();
    expect(contentList.length).toBeGreaterThan(0);
};
readDirectory.shouldMatchContentList = async (storage) => {
    expect.assertions(1);
    const { mockDir, mockDirContentList } = getVariables(storage);
    const contentList = await storage.readDirectory(mockDir);
    expect(contentList).toEqual(expect.arrayContaining(mockDirContentList));
};
readDirectory.shouldHaveNothing = async (storage) => {
    expect.assertions(1);
    const contentList = await storage.readDirectory('unexistent');
    expect(contentList).toEqual([]);
};

const getDirectoryContentLength: any = {};
getDirectoryContentLength.shouldHaveSomethingIntoRootdir = async (storage) => {
    expect.assertions(1);
    const value = await storage.getDirectoryContentLength();
    expect(value).toBeGreaterThan(0);
};
getDirectoryContentLength.shouldHaveSomethingIntoDir = async (storage) => {
    expect.assertions(1);
    const { mockDir } = getVariables(storage);
    const value = await storage.getDirectoryContentLength(mockDir);
    expect(value).toBeGreaterThan(0);
};
getDirectoryContentLength.shouldHaveNothingIntoUnexistentDirectory = async (storage) => {
    expect.assertions(1);
    const value = await storage.getDirectoryContentLength('unexistent');
    expect(value).toEqual(0);
};

const checkDirectoryContentLength: any = {};
checkDirectoryContentLength.shouldExistRootdir = async (storage) => {
    expect.assertions(1);
    const result = await storage.checkDirectoryContentLength();
    expect(result).toBeTruthy();
};
checkDirectoryContentLength.shouldExistDir = async (storage) => {
    expect.assertions(1);
    const { mockDir } = getVariables(storage);
    const result = await storage.checkDirectoryContentLength(mockDir);
    expect(result).toBeTruthy();
};
checkDirectoryContentLength.shouldNotExist = async (storage) => {
    expect.assertions(1);
    const result = await storage.checkDirectoryContentLength('unexistent');
    expect(result).toBeFalsy();
};

const cleanAfter = true;
const deleteFile: any = {};
deleteFile.shouldDo = async (storage) => {
    if (!cleanAfter) return;

    expect.assertions(1);
    const { mockFilePath } = getVariables(storage);
    await storage.deleteFile(mockFilePath);
    await expect(storage.readContent(mockFilePath)).rejects.toThrow();
};

const deleteDirectory: any = {};
deleteDirectory.shouldDeleteRecursively = async (storage) => {
    if (!cleanAfter) return;

    expect.assertions(1);
    const { mockDir } = getVariables(storage);
    const _path = [mockDir + '/'].join('/');
    await storage.deleteDirectory(_path);
    expect(await storage.checkDirectoryExists(mockDir)).toBeFalsy();
};
deleteDirectory.shouldOmitDeletionOfUnexistentDirectory = async (storage) => {
    if (!cleanAfter) return;

    expect.assertions(1);
    const { mockDir, mockSubdir } = getVariables(storage);
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
