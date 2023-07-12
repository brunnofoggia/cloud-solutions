import _debug from 'debug';
const debug = _debug('solutions:storage:aws:WriteStream');

import { Transform } from 'stream';

import { WriteStreamInterface } from '../../common/interfaces/writeStream.interface';
import { WriteStream as _WriteStream } from '../../common/abstract/writeStream';

export class WriteStream extends _WriteStream implements WriteStreamInterface {
    protected upload: any;
    protected filePath: string;

    constructor(protected _stream: Transform, options: any = {}) {
        super();
        this.upload = options.upload;
        this.filePath = options.filePath;
    }

    async write(content) {
        return await this._stream.write(content);
    }

    async end() {
        this._stream.end();
        await this.upload;
        debug(`Data written into ${this.filePath}`);
    }
}
