
"use client";

import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        setStoredValue(prevStoredValue => {
          const valueToStore = value instanceof Function ? value(prevStoredValue) : value;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }
          return valueToStore;
        });
      } catch (error) {
        console.error(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        if (event.newValue) {
          try {
            setStoredValue(JSON.parse(event.newValue));
          } catch (error) {
            console.error(`Error parsing new value for localStorage key “${key}” from storage event:`, error);
            setStoredValue(initialValue); // Fallback to initialValue
          }
        } else {
          // Handle item removal from another tab/window
          setStoredValue(initialValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  // This effect syncs initialValue changes if the key isn't in localStorage yet
   useEffect(() => {
    if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        if (item === null) { // Only update if not set in localStorage
             // Check if initialValue itself has changed reference and current storedValue is different
            if (JSON.stringify(initialValue) !== JSON.stringify(storedValue)) {
                 setStoredValue(initialValue);
                 window.localStorage.setItem(key, JSON.stringify(initialValue));
            }
        }
    }
   }, [key, initialValue, storedValue]);


  return [storedValue, setValue];
}

export default useLocalStorage;
