import { Writable } from 'stream';

export class BufferWritable extends Writable {
    data: any;

    constructor() {
        super();
        this.data = [];
    }

    _write(chunk, encoding, callback) {
        this.data.push(chunk);
        callback();
    }

    getData(charset: BufferEncoding) {
        return Buffer.concat(this.data).toString(charset || 'utf-8');
    }
}
