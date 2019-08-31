import { Protocol } from "./protocol";

/**
 * // http://bcat.bico.media/
 */
export class BcatPartProtocol {
  static address = '1ChDHzdd1H4wSjgGMHyndZm6qxEDGjqpJL';
  static description = 'B://cat part';

  static toASM(data: Buffer) {
    return [
      this.address,
      data
    ];
  }
}
export interface BcatPartProtocol extends Protocol {}
