import { useEffect, useRef, useState, useCallback } from 'react';
import { SecureStorage } from '@/utils/secureStorage';

interface AutoSaveOptions {
  interval?: number; // milliseconds, default 30 seconds
  enabled?: boolean;
  storageKey: string;
}

interface AutoSaveReturn {
  lastSaved: Date | null;
  isSaving: boolean;
  forceSave: () => Promise<void>;
  clearAutoSave: () => void;
}

export function useAutoSave<T>(
  data: T,
  saveFunction: (data: T) => Promise<void> | void,
  options: AutoSaveOptions
): AutoSaveReturn {
  const { interval = 30000, enabled = true, storageKey } = options;
  
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const previousDataRef = useRef<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Serialize data for comparison
  const serializeData = useCallback((d: T): string => {
    try {
      return JSON.stringify(d);
    } catch {
      return String(d);
    }
  }, []);

  // Check if data has changed
  const hasDataChanged = useCallback((currentData: T): boolean => {
    const serialized = serializeData(currentData);
    return serialized !== previousDataRef.current && serialized !== '{}' && serialized !== '';
  }, [serializeData]);

  // Force save function
  const forceSave = useCallback(async () => {
    if (!enabled || isSaving) return;

    try {
      setIsSaving(true);
      
      // Save to storage
      const serialized = serializeData(data);
      SecureStorage.setItem(storageKey, serialized, 60 * 60 * 1000); // 1 hour TTL
      
      // Call the provided save function
      await Promise.resolve(saveFunction(data));
      
      previousDataRef.current = serialized;
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [data, enabled, isSaving, saveFunction, serializeData, storageKey]);

  // Clear auto-save data
  const clearAutoSave = useCallback(() => {
    SecureStorage.removeItem(storageKey);
    previousDataRef.current = '';
    setLastSaved(null);
  }, [storageKey]);

  // Auto-save effect
  useEffect(() => {
    if (!enabled) return;

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Only save if data has changed
    if (hasDataChanged(data)) {
      saveTimeoutRef.current = setTimeout(() => {
        forceSave();
      }, interval);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, enabled, forceSave, hasDataChanged, interval]);

  // Initialize previous data on mount
  useEffect(() => {
    previousDataRef.current = serializeData(data);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    lastSaved,
    isSaving,
    forceSave,
    clearAutoSave
  };
}

