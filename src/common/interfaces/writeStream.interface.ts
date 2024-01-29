import { ReadStream } from 'fs';

export interface WriteStreamInterface {
    getLineIndex();
    getLineNumber();
    isFirstLine();
    writeLine(content: string);
    writeReadStream(readStream: ReadStream);
    write(content: string);
    end();
}
