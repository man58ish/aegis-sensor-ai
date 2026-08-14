import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// 1. Adaptive Cost Factor for Bcrypt
const BCRYPT_SALT_ROUNDS = 12;

// 2. Auto-generate RSA Keys
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

export class SecurityEngine {
  // Password Hashing
  static async hashSecret(plainText: string): Promise<string> {
    return await bcrypt.hash(plainText, BCRYPT_SALT_ROUNDS);
  }

  // Secret Verification
  static async verifySecret(plainText: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plainText, hash);
  }

  // JWT Generation (Signed with Private Key)
  static generateEdgeToken(payload: object, expiresIn: string | number = '1h'): string {
    const options: SignOptions = { 
      algorithm: 'RS256',
      expiresIn: expiresIn as any 
    };
    return jwt.sign(payload, privateKey, options);
  }

  // JWT Validation (Verified with Public Key)
  static verifyEdgeToken(token: string): any {
    try {
      return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    } catch (error) {
      throw new Error('Invalid or Expired Telemetry Token');
    }
  }
}