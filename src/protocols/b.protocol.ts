
/**
 * B:// format https://github.com/unwriter/B
 */
export class BProtocol {
  static address = '19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut';

  static from(data: Buffer | string, fileName: string, mimeType = ' ', encoding = ' ') {
    return [
      this.address, // B://
      data, // Data
      mimeType, // Media Type
      encoding, // Encoding
      fileName // Filename
    ];
  }
}