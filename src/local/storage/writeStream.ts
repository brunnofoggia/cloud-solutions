import { WriteStreamInterface } from '../../common/interfaces/writeStream.interface';
import { WriteStream as _WriteStream } from '../../common/abstract/writeStream';

export class WriteStream extends _WriteStream implements WriteStreamInterface {
    protected upload: any;
    protected content = '';

    constructor(protected _stream: any, options: any = {}) {
        super();
    }

    async write(content) {
        // this.content += content;
        await this._stream.write(content);
    }

    async end() {
        // return await this.upload(this.content);
        return await this._stream.end();
    }
}
