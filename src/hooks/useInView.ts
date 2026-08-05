import { useEffect, useRef, useState } from 'react'

/**
 * Custom hook to determine if an element is in view using the Intersection Observer API.
 *
 * @param options - Optional configuration for the Intersection Observer, such as root margin and threshold.
 * @returns An object containing a ref to be attached to the target element and a boolean indicating if the element is in view.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit,
) {
  const ref = useRef<T>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0, ...options },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, isInView }
}
