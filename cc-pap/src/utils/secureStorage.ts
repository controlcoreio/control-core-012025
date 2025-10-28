
export class SecureStorage {
  private static readonly ENCRYPTION_KEY = 'controlcore-local-key';
  
  // Simple XOR encryption for client-side storage (better than plain localStorage)
  private static encrypt(text: string): string {
    const key = this.ENCRYPTION_KEY;
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
  }
  
  private static decrypt(encryptedText: string): string {
    try {
      const text = atob(encryptedText);
      const key = this.ENCRYPTION_KEY;
      let result = '';
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    } catch {
      return '';
    }
  }
  
  static setItem(key: string, value: string, ttl?: number): void {
    const data = {
      value,
      timestamp: Date.now(),
      ttl: ttl || 24 * 60 * 60 * 1000 // 24 hours default
    };
    
    const encrypted = this.encrypt(JSON.stringify(data));
    sessionStorage.setItem(key, encrypted);
  }
  
  static getItem(key: string): string | null {
    const encrypted = sessionStorage.getItem(key);
    if (!encrypted) return null;
    
    try {
      const decrypted = this.decrypt(encrypted);
      const data = JSON.parse(decrypted);
      
      // Check if data has expired
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
    sessionStorage.removeItem(key);
  }
  
  static clear(): void {
    sessionStorage.clear();
  }
  
  static getAllKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
    return keys;
  }
  
  static getItemsMatching(prefix: string): Record<string, string> {
    const items: Record<string, string> = {};
    const keys = this.getAllKeys();
    
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        const value = this.getItem(key);
        if (value !== null) {
          items[key] = value;
        }
      }
    }
    
    return items;
  }
}
