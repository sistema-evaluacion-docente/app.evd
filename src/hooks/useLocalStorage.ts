import { useCallback, useState } from 'react'

/** * Custom hook to manage a value in localStorage with React state.
 *
 * @template T - The type of the value to be stored in localStorage.
 * @param key - The key under which the value is stored in localStorage.
 * @param initialValue - The initial value to use if there is no value in localStorage.
 * @returns A tuple containing the current value and a function to update it.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value
        localStorage.setItem(key, JSON.stringify(next))
        return next
      })
    },
    [key],
  )

  return [storedValue, setValue] as const
}
