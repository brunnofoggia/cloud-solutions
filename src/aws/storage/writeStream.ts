import { Transform } from 'stream';

export class WriteStream {
    protected upload: any;
    constructor(protected _stream: Transform, options: any = {}) {
        this.upload = options.upload;
    }

    write(content) {
        return this._stream.write(content);
    }

    async end() {
        this._stream.end();
        return await this.upload;
    }
}