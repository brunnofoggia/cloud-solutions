import { ReadStream } from 'fs';

export abstract class WriteStream {
    protected lineIndex = 0;

    getRawStream() {
        return this['_stream'];
    }

    on(event: string, callback: any) {
        return this['_stream']?.on(event, callback);
    }

    isFirstLine() {
        return !this.lineIndex;
    }

    getLineIndex() {
        return this.lineIndex;
    }

    getLineNumber() {
        return this.getLineIndex() + 1;
    }

    async writeLine(content) {
        const lineBreak = this.isFirstLine() ? '' : '\n';
        this.lineIndex++;

        return await this.write(lineBreak + content);
    }

    async writeReadStream(readStream: ReadStream, terminate = false) {
        for await (const line of readStream) {
            await this.writeLine(line);
        }
        terminate && (await this['end']());
    }

    abstract end();
    abstract write(content);
}
