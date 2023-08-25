import { WriteStreamInterface } from '../../common/interfaces/writeStream.interface';
import { WriteStream as _WriteStream } from '../../common/abstract/writeStream';

export class TextStreamUtil extends _WriteStream implements WriteStreamInterface {
    protected content = '';

    async write(content) {
        this.content += content;
    }

    async end() {
        null;
    }

    getContent() {
        return this.content;
    }
}
