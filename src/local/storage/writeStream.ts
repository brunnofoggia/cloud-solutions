import _debug from 'debug';
// const log = _debug('solutions:storage:local:WriteStream');
const debug = _debug('debug:solutions:storage:local:WriteStream');

import { WriteStreamInterface } from '../../common/interfaces/writeStream.interface';
import { WriteStream as _WriteStream } from '../../common/abstract/writeStream';

export class WriteStream extends _WriteStream implements WriteStreamInterface {
    protected upload: any;
    protected filePath: string;

    constructor(protected _stream: any, options: any = {}) {
        super();
        this.filePath = options.filePath;
    }

    async write(content) {
        await this._stream.write(content);
    }

    async end() {
        return new Promise((resolve) => {
            this._stream.end();
            this._stream.on('close', async () => {
                debug(`Data written into ${this.filePath}`);
                resolve(true);
            });
        });
    }
}
