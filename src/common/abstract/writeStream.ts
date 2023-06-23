import { ReadStream } from 'fs';

export class WriteStream {
    protected firstLine = true;

    async writeLine(content) {
        const lineBreak = this.firstLine ? '' : '\n';
        this.firstLine = false;
        return await this['write'](lineBreak + content);
    }

    async writeReadStream(readStream: ReadStream, terminate = false) {
        for await (const line of readStream) {
            await this.writeLine(line);
        }
        terminate && (await this['end']());
    }
}
