const timestamp = Date.now();
export const mockDir = `cloud-testdir-${timestamp}`;
export const mockFilePath = `cloud-${timestamp}.txt`;
export const mockFileStreamPath = [mockDir, `stream-${timestamp}.txt`].join('/');
export const mockFileContent = 'test content';
export const mockFileStreamContent = `stream line 1
stream line 2`;
export const mockSubdir = 'subdir';
export const mockSubdirFileName = 'subfile.txt';
export const mockSubdirFilePath = [mockDir, mockSubdir, mockSubdirFileName].join('/');
export const mockDirContentList = [mockFileStreamPath, mockSubdirFilePath];
