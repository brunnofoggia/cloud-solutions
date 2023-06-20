import _debug from 'debug';
const debug = _debug('solutions:storage:aws:WriteStream');

import { Transform } from 'stream';

export class WriteStream {
    protected upload: any;
    protected filePath: string;

    constructor(protected _stream: Transform, options: any = {}) {
        this.upload = options.upload;
        this.filePath = options.filePath;
    }

    write(content) {
        return this._stream.write(content);
    }

    async end() {
        this._stream.end();
        await this.upload;
        debug(`Os dados foram escritos em ${this.filePath}`);
    }
}
