import { LineBreakerEnum } from '../types/lineBreaker.enum';

export async function streamToString(streamInterface, encode: BufferEncoding = 'utf-8', lineBreaker: LineBreakerEnum = LineBreakerEnum.LF) {
    const chunks = [];
    let firstLine = true;
    const _lineBreaker = encode !== 'binary' ? lineBreaker : '';

    for await (const chunk of streamInterface) {
        if (!firstLine && _lineBreaker) chunks.push(Buffer.from(_lineBreaker));
        chunks.push(Buffer.from(chunk));

        firstLine = false;
    }

    return Buffer.concat(chunks).toString(encode);
}
