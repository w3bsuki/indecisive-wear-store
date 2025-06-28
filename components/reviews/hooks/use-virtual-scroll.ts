import { useState, useEffect, useRef, useCallback } from "react"

interface UseVirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
}

export function useVirtualScroll<T>(
  items: T[],
  { itemHeight, containerHeight, overscan = 3 }: UseVirtualScrollOptions
) {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = items.slice(startIndex, endIndex + 1)
  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  const handleScroll = useCallback(() => {
    if (scrollElementRef.current) {
      setScrollTop(scrollElementRef.current.scrollTop)
    }
  }, [])

  useEffect(() => {
    const scrollElement = scrollElementRef.current
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll, { passive: true })
      return () => scrollElement.removeEventListener("scroll", handleScroll)
    }
  }, [handleScroll])

  return {
    scrollElementRef,
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
  }
}