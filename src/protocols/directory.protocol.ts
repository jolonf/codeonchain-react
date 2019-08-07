
/**
 *  https://github.com/jolonf/bitcom-protocols/blob/master/directory-protocol.md
 */
export class DirectoryProtocol {
  static address = '1FR1dTwavR2exZvy2JxKL2Dv2nCMEMtB5N';

  static from(folderName: string) {
    return [
      this.address,
      folderName
    ];
  }
}