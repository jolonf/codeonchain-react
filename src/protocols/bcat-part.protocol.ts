
/**
 * // http://bcat.bico.media/
 */
export class BcatPartProtocol {
  static address = '1ChDHzdd1H4wSjgGMHyndZm6qxEDGjqpJL';

  static from(data: Buffer) {
    return [
      this.address,
      data
    ];
  }

}