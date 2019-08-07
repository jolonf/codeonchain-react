
/**
 *  https://github.com/jolonf/bitcom-protocols/blob/master/derivation-path-protocol.md
 */
export class DerivationPathProtocol {
  static address = '179UZJnghXeAMzH4kBRqLpqeoHRaefwyd2';

  static from(derivationPath: string): string[] {
    return [
      this.address,
      derivationPath
    ];
  }
}