import _debug from 'debug';
const debug = _debug('solutions:storage:gcp:WriteStream');

import { WriteStreamInterface } from '../../common/interfaces/writeStream.interface';
import { WriteStream as _WriteStream } from '../../common/abstract/writeStream';
import { defaults } from 'lodash';

export class WriteStream extends _WriteStream implements WriteStreamInterface {
    protected upload: any;
    protected params: any;
    protected static defaultParams: any = { encode: 'utf8' };
    protected filePath: string;
    protected buffer: any;
    protected bufferLimit = 5 * 1024 * 1024;
    protected totalLength = 0;

    constructor(protected _stream: any, options: any = {}) {
        super();
        this.params = defaults({}, options.params || {}, WriteStream.defaultParams);
        this.filePath = options.filePath;
        this.buffer = Buffer.alloc(0);

        if (options.streamPartSize) this.bufferLimit = options.streamPartSize;
    }

    async write(content) {
        this.buffer = Buffer.concat([this.buffer, Buffer.from(content, this.params.encode)]);

        if (this.buffer.length >= this.bufferLimit) {
            await this.uploadBuffer();
        }
    }

    async end() {
        await this.uploadBuffer();
        await this._stream.end();
        debug(`Data written into ${this.filePath}`);
    }

    async uploadBuffer() {
        if (this.buffer.length > 0) {
            this.totalLength += this.buffer.length;
            await this._stream.write(this.buffer);
            this.buffer = Buffer.alloc(0);
        }
    }
}
