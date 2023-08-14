import { ReadStream } from 'fs';

export interface WriteStreamInterface {
    isFirstLine();
    writeLine(content: string);
    writeReadStream(readStream: ReadStream);
    write(content: string);
    end();
}
