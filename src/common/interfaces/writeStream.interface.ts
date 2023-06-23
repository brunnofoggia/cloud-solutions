import { ReadStream } from 'fs';

export interface WriteStreamInterface {
    writeLine(content: string);
    writeReadStream(readStream: ReadStream);
    write(content: string);
    end();
}
