"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core = require("@actions/core");
function detectFileEncodingWithBOM(fileName, buffer) {
    core.debug('Detecting file encoding using BOM');
    if (buffer.slice(0, 3).equals(Buffer.from([239, 187, 191]))) {
        return {
            encoding: 'utf-8',
            withBOM: true
        };
    }
    else if (buffer.slice(0, 4).equals(Buffer.from([255, 254, 0, 0]))) {
        throw Error(`Detected file encoding of the file ${fileName} as UTF-32LE. Variable substitution is not supported with file encoding UTF-32LE. Supported encodings are UTF-8 and UTF-16LE.`);
    }
    else if (buffer.slice(0, 2).equals(Buffer.from([254, 255]))) {
        throw Error(`Detected file encoding of the file ${fileName} as UTF-32BE. Variable substitution is not supported with file encoding UTF-32BE. Supported encodings are UTF-8 and UTF-16LE.`);
    }
    else if (buffer.slice(0, 2).equals(Buffer.from([255, 254]))) {
        return {
            encoding: 'utf-16le',
            withBOM: true
        };
    }
    else if (buffer.slice(0, 4).equals(Buffer.from([0, 0, 254, 255]))) {
        throw Error(`Detected file encoding of the file ${fileName} as UTF-32BE. Variable substitution is not supported with file encoding UTF-32BE. Supported encodings are UTF-8 and UTF-16LE.`);
    }
    core.debug('Unable to detect File encoding using BOM');
    return null;
}
function detectFileEncodingWithoutBOM(fileName, buffer) {
    core.debug('Detecting file encoding without BOM');
    let typeCode = 0;
    for (let index = 0; index < 4; index++) {
        typeCode = typeCode << 1;
        typeCode = typeCode | (buffer[index] > 0 ? 1 : 0);
    }
    switch (typeCode) {
        case 1:
            throw Error(`Detected file encoding of the file ${fileName} as UTF-32BE. Variable substitution is not supported with file encoding UTF-32BE. Supported encodings are UTF-8 and UTF-16 LE.`);
        case 5:
            throw Error(`Detected file encoding of the file ${fileName} as UTF-16BE. Variable substitution is not supported with file encoding UTF-16BE. Supported encodings are UTF-8 and UTF-16 LE.`);
        case 8:
            throw Error(`Detected file encoding of the file ${fileName} as UTF-32LE. Variable substitution is not supported with file encoding UTF-32LE. Supported encodings are UTF-8 and UTF-16 LE.`);
        case 10:
            return {
                encoding: 'utf-16le',
                withBOM: false
            };
        case 15:
            return {
                encoding: 'utf-8',
                withBOM: false
            };
        default:
            throw Error(`Unable to detect encoding of the file ${fileName} (typeCode: ${typeCode}). Supported encodings are UTF-8 and UTF-16 LE.`);
    }
}
function detectFileEncoding(fileName, buffer) {
    if (buffer.length < 4) {
        throw Error(`File buffer is too short to detect encoding type : ${fileName}`);
    }
    let fileEncoding = detectFileEncodingWithBOM(fileName, buffer) || detectFileEncodingWithoutBOM(fileName, buffer);
    return fileEncoding;
}
exports.detectFileEncoding = detectFileEncoding;
