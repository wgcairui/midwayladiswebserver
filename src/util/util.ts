import { Provide } from '@midwayjs/decorator';
import * as jsonwebtoken from 'jsonwebtoken';
import * as CryptoJS from 'crypto-js';
import axios from 'axios';
import { createGzip } from 'zlib';
import { pipeline } from 'stream';
import { createReadStream, createWriteStream, PathLike } from 'fs';

import { promisify } from 'util';
const pipe = promisify(pipeline);

/**
 * 工具链
 */
@Provide()
export class Util {
  /**
   * token盐值
   */
  private secret: string;
  /**
   * token过期时间
   */
  private tokenExpiresTime: number;
  /**
   * crypto 十六位十六进制数作为密钥
   */
  private cryptoKey: CryptoJS.lib.WordArray;
  /**
   * crypto 十六位十六进制数作为密钥偏移量
   */
  private cryptoIv: CryptoJS.lib.WordArray;
  constructor() {
    this.secret = 'ladisWebSite';
    this.tokenExpiresTime = 1000 * 60 * 60 * 5;
    this.cryptoKey = CryptoJS.enc.Utf8.parse('94nxeywgxwbakx83');
    this.cryptoIv = CryptoJS.enc.Utf8.parse('xheg73k0kxhw83nx');
  }

  /**
   *加密函数
   *payload为加密的数据，数据类型string or object
   * @param {*} { payload, option }
   * @returns
   */
  Secret_JwtSign(
    payload: string | object | Buffer,
    options?: jsonwebtoken.SignOptions
  ) {
    const result: Promise<string> = new Promise((resolve, reject) => {
      const opt = Object.assign(
        { expiresIn: this.tokenExpiresTime },
        options || {}
      );
      jsonwebtoken.sign(payload, this.secret, opt, (err, encodeURI) => {
        if (err) reject(err);
        resolve(encodeURI as string);
      });
    });
    return result;
  }

  /**
   * 解密函数
   * @param token
   */
  Secret_JwtVerify<T>(token: string): Promise<T> {
    const result = new Promise<T>((resolve, reject) => {
      jsonwebtoken.verify(token, this.secret, (err, decode) => {
        if (err) reject(err);
        resolve(decode as any);
      });
    });
    return result;
  }

  /**
   * 解密字符串
   * @param word 加密的字符串
   * @returns
   */
  Crypto_Decrypto(word: string) {
    const encryptedHexStr = CryptoJS.enc.Hex.parse(word);
    const srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
    const decrypt = CryptoJS.AES.decrypt(srcs, this.cryptoKey, {
      iv: this.cryptoIv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
    return decryptedStr.toString();
  }

  /**
   * 加密字符串
   * @param word 原始字符串
   * @returns
   */
  Crypto_Encrypto(word: string) {
    const srcs = CryptoJS.enc.Utf8.parse(word);
    const encrypted = CryptoJS.AES.encrypt(srcs, this.cryptoKey, {
      iv: this.cryptoIv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.ciphertext.toString().toUpperCase();
  }

  /**
   * 发送短信验证码
   * @param tel
   */
  async SendValidation(tel: string) {
    return await axios
      .post<{ code: string; result: Uart.ApolloMongoResult }>(
        'https://uart.ladishb.com/api/open/sendValidationSms',
        { tel: String(tel).trim() }
      )
      .then(data => data.data);
  }



  /**
   * 压缩文件
   * @param input 
   * @param output 
   */
  async do_gzip(input: PathLike, output: PathLike) {
    const gzip = createGzip();
    const source = createReadStream(input);
    const destination = createWriteStream(output);
    await pipe(source, gzip, destination);
  }
}
