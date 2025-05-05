import { ethers } from 'ethers';

export class SecureKeyGenerator {
  /**
   * Generate a new secure key pair
   * @returns {Promise<{ privateKey: string; address: string }>} Generated key pair
   */
  static async generateNewKeyPair(): Promise<{ privateKey: string; address: string }> {
    // Generate a cryptographically secure random key
    const wallet = ethers.Wallet.createRandom();
    
    return {
      privateKey: wallet.privateKey,
      address: wallet.address
    };
  }

  /**
   * Generate a secure mnemonic phrase
   * @returns {Promise<string>} Generated mnemonic phrase
   */
  static async generateMnemonic(): Promise<string> {
    return ethers.Wallet.createRandom().mnemonic.phrase;
  }

  /**
   * Import a wallet from a private key
   * @param privateKey - The private key to import
   * @returns {Promise<{ privateKey: string; address: string }>} Imported wallet details
   */
  static async importFromPrivateKey(privateKey: string): Promise<{ privateKey: string; address: string }> {
    const wallet = new ethers.Wallet(privateKey);
    return {
      privateKey: wallet.privateKey,
      address: wallet.address
    };
  }

  /**
   * Import a wallet from a mnemonic phrase
   * @param mnemonic - The mnemonic phrase to import
   * @returns {Promise<{ privateKey: string; address: string }>} Imported wallet details
   */
  static async importFromMnemonic(mnemonic: string): Promise<{ privateKey: string; address: string }> {
    const wallet = ethers.Wallet.fromMnemonic(mnemonic);
    return {
      privateKey: wallet.privateKey,
      address: wallet.address
    };
  }

  /**
   * Validate if a private key is valid
   * @param privateKey - The private key to validate
   * @returns {boolean} Whether the private key is valid
   */
  static validatePrivateKey(privateKey: string): boolean {
    try {
      new ethers.Wallet(privateKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate if a mnemonic phrase is valid
   * @param mnemonic - The mnemonic phrase to validate
   * @returns {boolean} Whether the mnemonic phrase is valid
   */
  static validateMnemonic(mnemonic: string): boolean {
    try {
      ethers.Wallet.fromMnemonic(mnemonic);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate a secure password hash
   * @param password - The password to hash
   * @returns {Promise<string>} The hashed password
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await crypto.subtle.generateKey(
      {
        name: 'PBKDF2',
        salt: crypto.getRandomValues(new Uint8Array(16)),
        iterations: 100000,
        hash: 'SHA-256'
      },
      true,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(salt.salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      key,
      256
    );

    return Array.from(new Uint8Array(derivedKey))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
