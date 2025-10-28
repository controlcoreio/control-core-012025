import { useEffect, useState } from 'react';
import { SecureStorage } from '@/utils/secureStorage';

interface UnsavedWorkRecoveryOptions {
  storageKey: string;
  maxAge?: number; // milliseconds, default 1 hour
}

interface UnsavedWorkRecoveryReturn<T> {
  hasUnsavedWork: boolean;
  unsavedData: T | null;
  restoreWork: () => void;
  discardWork: () => void;
}

export function useUnsavedWorkRecovery<T>(
  options: UnsavedWorkRecoveryOptions,
  onRestore?: (data: T) => void
): UnsavedWorkRecoveryReturn<T> {
  const { storageKey, maxAge = 60 * 60 * 1000 } = options; // Default 1 hour
  
  const [hasUnsavedWork, setHasUnsavedWork] = useState(false);
  const [unsavedData, setUnsavedData] = useState<T | null>(null);

  useEffect(() => {
    // Check for unsaved work on mount
    const checkForUnsavedWork = () => {
      try {
        const savedData = SecureStorage.getItem(storageKey);
        
        if (savedData) {
          const parsed = JSON.parse(savedData) as T;
          
          // Check if data is recent enough
          const storageTimestamp = SecureStorage.getItem(`${storageKey}_timestamp`);
          if (storageTimestamp) {
            const timestamp = parseInt(storageTimestamp);
            const age = Date.now() - timestamp;
            
            if (age <= maxAge) {
              setUnsavedData(parsed);
              setHasUnsavedWork(true);
              return;
            }
          }
          
          // Data too old, remove it
          SecureStorage.removeItem(storageKey);
          SecureStorage.removeItem(`${storageKey}_timestamp`);
        }
      } catch (error) {
        console.error('Error checking for unsaved work:', error);
        // Clear corrupt data
        SecureStorage.removeItem(storageKey);
        SecureStorage.removeItem(`${storageKey}_timestamp`);
      }
    };

    checkForUnsavedWork();
  }, [storageKey, maxAge]);

  const restoreWork = () => {
    if (unsavedData && onRestore) {
      onRestore(unsavedData);
    }
    setHasUnsavedWork(false);
    setUnsavedData(null);
    SecureStorage.removeItem(storageKey);
    SecureStorage.removeItem(`${storageKey}_timestamp`);
  };

  const discardWork = () => {
    setHasUnsavedWork(false);
    setUnsavedData(null);
    SecureStorage.removeItem(storageKey);
    SecureStorage.removeItem(`${storageKey}_timestamp`);
  };

  return {
    hasUnsavedWork,
    unsavedData,
    restoreWork,
    discardWork
  };
}

