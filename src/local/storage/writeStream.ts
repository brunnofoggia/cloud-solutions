export class WriteStream {
    protected upload: any;
    protected content = '';

    constructor(upload) {
        this.upload = upload;
    }

    write(content) {
        this.content += content;
    }

    async end() {
        return await this.upload(this.content);
    }
}
