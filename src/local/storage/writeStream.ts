import { WriteStreamInterface } from '../../common/interfaces/writeStream.interface';
import { WriteStream as _WriteStream } from '../../common/abstract/writeStream';

export class WriteStream extends _WriteStream implements WriteStreamInterface {
    protected upload: any;
    protected content = '';

    constructor(upload) {
        super();
        this.upload = upload;
    }

    async write(content) {
        this.content += content;
    }

    async end() {
        return await this.upload(this.content);
    }
}
