import _debug from 'debug';
// const log = _debug('solutions:storage:aws:WriteStream');
const debug = _debug('debug:solutions:storage:sftp:WriteStream');

import { Transform } from 'stream';

import { WriteStreamInterface } from '../../common/interfaces/writeStream.interface';
import { WriteStream as _WriteStream } from '../../common/abstract/writeStream';

export class WriteStream extends _WriteStream implements WriteStreamInterface {
    protected upload: any;
    protected filePath: string;
    public options: any;

    constructor(protected _stream: Transform, options: any = {}) {
        super();
        this.filePath = options.filePath;
        this.options = options;
    }

    async write(content) {
        return await this._stream.write(content);
    }

    async end() {
        return new Promise((resolve) => {
            this._stream.on('finish', async () => {
                debug(`Data written into ${this.filePath}`);
                this.options.closeInstance && (await this.options.closeInstance());
                resolve(true);
            });
            this._stream.end();
        });
    }
}
