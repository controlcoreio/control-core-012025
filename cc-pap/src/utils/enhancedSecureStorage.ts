
export class EnhancedSecureStorage {
  private static readonly STORAGE_PREFIX = 'cc_secure_';
  private static readonly ENCRYPTION_VERSION = 'v2';
  
  // Generate a more secure encryption key based on browser fingerprint
  private static generateEncryptionKey(): string {
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      'controlcore-enhanced-key'
    ].join('|');
    
    return btoa(fingerprint).slice(0, 32);
  }
  
  // Enhanced encryption using multiple rounds
  private static encrypt(text: string): string {
    const key = this.generateEncryptionKey();
    let result = text;
    
    // Multiple rounds of encryption
    for (let round = 0; round < 3; round++) {
      let encrypted = '';
      const roundKey = key + round;
      
      for (let i = 0; i < result.length; i++) {
        const keyChar = roundKey.charCodeAt(i % roundKey.length);
        const textChar = result.charCodeAt(i);
        encrypted += String.fromCharCode(textChar ^ keyChar);
      }
      
      result = btoa(encrypted);
    }
    
    return `${this.ENCRYPTION_VERSION}:${result}`;
  }
  
  private static decrypt(encryptedText: string): string {
    try {
      const [version, data] = encryptedText.split(':');
      
      if (version !== this.ENCRYPTION_VERSION) {
        console.warn('Encrypted data version mismatch, clearing storage');
        return '';
      }
      
      const key = this.generateEncryptionKey();
      let result = data;
      
      // Reverse the encryption rounds
      for (let round = 2; round >= 0; round--) {
        const roundKey = key + round;
        const decoded = atob(result);
        let decrypted = '';
        
        for (let i = 0; i < decoded.length; i++) {
          const keyChar = roundKey.charCodeAt(i % roundKey.length);
          const encryptedChar = decoded.charCodeAt(i);
          decrypted += String.fromCharCode(encryptedChar ^ keyChar);
        }
        
        result = decrypted;
      }
      
      return result;
    } catch {
      return '';
    }
  }
  
  static setItem(key: string, value: string, ttl: number = 24 * 60 * 60 * 1000): void {
    const data = {
      value,
      timestamp: Date.now(),
      ttl,
      integrity: this.calculateIntegrity(value)
    };
    
    const encrypted = this.encrypt(JSON.stringify(data));
    sessionStorage.setItem(this.STORAGE_PREFIX + key, encrypted);
  }
  
  static getItem(key: string): string | null {
    const encrypted = sessionStorage.getItem(this.STORAGE_PREFIX + key);
    if (!encrypted) return null;
    
    try {
      const decrypted = this.decrypt(encrypted);
      if (!decrypted) return null;
      
      const data = JSON.parse(decrypted);
      
      // Check integrity
      if (data.integrity !== this.calculateIntegrity(data.value)) {
        this.removeItem(key);
        return null;
      }
      
      // Check TTL
      if (Date.now() - data.timestamp > data.ttl) {
        this.removeItem(key);
        return null;
      }
      
      return data.value;
    } catch {
      this.removeItem(key);
      return null;
    }
  }
  
  static removeItem(key: string): void {
    sessionStorage.removeItem(this.STORAGE_PREFIX + key);
  }
  
  static clear(): void {
    // Only clear our prefixed items
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(this.STORAGE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  }
  
  private static calculateIntegrity(value: string): string {
    // Simple integrity check using a hash-like function
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
}
