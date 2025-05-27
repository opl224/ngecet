
"use client";

import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = (value: T | ((val: T) => T)) => void;

function useLocalStorage<T>(key: string, initialValue: T | (() => T)): [T, SetValue<T>] {
  const getInitialValue = useCallback(() => {
    return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  }, [initialValue]);

  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return getInitialValue();
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : getInitialValue();
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return getInitialValue();
    }
  }, [key, getInitialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue: SetValue<T> = useCallback(valueOrFn => {
    if (typeof window === 'undefined') {
      console.warn(`Attempted to set localStorage key "${key}" in a non-browser environment. Operation skipped.`);
      // Do not call setStoredValue if we can't persist to localStorage,
      // to avoid desync between React state and (non-existent) localStorage.
      return;
    }
    try {
      setStoredValue(prevStoredValue => {
        const newValue = valueOrFn instanceof Function ? valueOrFn(prevStoredValue) : valueOrFn;
        window.localStorage.setItem(key, JSON.stringify(newValue));
        return newValue;
      });
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]); // Removed storedValue, setStoredValue is stable.

  useEffect(() => {
    // Sync state with localStorage on initial mount or if readValue changes.
    setStoredValue(readValue());
  }, [readValue]);
  
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.storageArea === window.localStorage) {
        if (event.newValue === null) { // Item removed or cleared
          setStoredValue(getInitialValue());
        } else {
          try {
            setStoredValue(JSON.parse(event.newValue));
          } catch (error) {
            console.warn(`Error parsing storage change for key "${key}":`, error);
            setStoredValue(getInitialValue()); // Fallback
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, getInitialValue]);


  return [storedValue, setValue];
}

export default useLocalStorage;
