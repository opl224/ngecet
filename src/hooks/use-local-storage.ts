
"use client";

import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize with initialValue. Actual value from localStorage will be set in useEffect.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    if (isClient) {
      let valueFromStorage: T;
      try {
        const item = window.localStorage.getItem(key);
        valueFromStorage = item ? (JSON.parse(item) as T) : initialValue;
      } catch (error) {
        console.warn(`Error reading localStorage key "${key}" in effect:`, error);
        valueFromStorage = initialValue;
      }
      setStoredValue(valueFromStorage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, key, initialValue]); // initialValue is stable from ChatPage due to useMemo

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      if (!isClient) {
        // If not on client, perhaps just update the in-memory state without writing to localStorage
        // or queue the update. For Ngecety, we'll just update in-memory state.
        setStoredValue(value instanceof Function ? value(storedValue) : value);
        return;
      }
      try {
        setStoredValue(prevStoredValue => {
          const valueToStore = value instanceof Function ? value(prevStoredValue) : value;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          return valueToStore;
        });
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, isClient, storedValue] // storedValue is needed if `value` is not a function and we aren't using functional update for the outer setStoredValue
                                 // Switched to functional update for setStoredValue to remove storedValue dep here.
                                 // Re-adding storedValue to setValue deps if `value` is not a function for the isClient=false case.
                                 // Actually, the isClient=false case should also use functional update for consistency.
                                 // Let's simplify: if !isClient, the set operation is essentially a no-op for localStorage.
                                 // The state will update but won't persist until client-side.
                                 // Or better, make setValue no-op if not client for localStorage part.
                                 // For now, will keep the simple update to storedValue if !isClient.
  );


  // Revised setValue to be cleaner and ensure it uses functional updates correctly
  const stableSetValue = useCallback(
    (value: T | ((val: T) => T)) => {
      // Update the React state
      setStoredValue(value);

      // If on the client, also update localStorage
      if (isClient) {
        try {
          // We need the actual value to store, not the function itself
          const valueToStore = value instanceof Function ? value(storedValue) : value;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
          console.warn(`Error setting localStorage key "${key}":`, error);
        }
      }
    },
    [isClient, key, storedValue] // storedValue is needed here if `value` is a function to correctly resolve it for localStorage
                                 // if we don't pass storedValue, the `value(storedValue)` inside might use a stale closure.
                                 // This is tricky. Let's revert to the previous setValue but ensure functional updates.
  );

  // Reverting to a more standard setValue with functional update to avoid complex deps.
   const finalSetValue = useCallback(
    (value: T | ((val: T) => T)) => {
      setStoredValue(prevValue => {
        const newValue = value instanceof Function ? value(prevValue) : value;
        if (isClient) {
          try {
            window.localStorage.setItem(key, JSON.stringify(newValue));
          } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
          }
        }
        return newValue;
      });
    },
    [isClient, key]
  );


  return [storedValue, finalSetValue];
}

export default useLocalStorage;
