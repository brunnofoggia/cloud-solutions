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

    getData(encode: BufferEncoding) {
        return Buffer.concat(this.data).toString(encode || 'utf-8');
    }
}
