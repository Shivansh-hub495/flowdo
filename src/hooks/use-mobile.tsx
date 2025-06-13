import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

interface SwipeGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
  edgeThreshold?: number
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  edgeThreshold = 30
}: SwipeGestureOptions) {
  const isMobile = useIsMobile()
  const touchStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null)
  const isSwipingRef = React.useRef(false)

  const handleTouchStart = React.useCallback((e: TouchEvent) => {
    if (!isMobile) return

    const touch = e.touches[0]
    const startX = touch.clientX
    const startY = touch.clientY

    touchStartRef.current = {
      x: startX,
      y: startY,
      time: Date.now()
    }

    // Check if touch started from left edge for opening sidebar
    if (startX <= edgeThreshold) {
      isSwipingRef.current = true
      // Add visual feedback for edge swipe
      document.body.classList.add('mobile-swipe-active')
    }
  }, [isMobile, edgeThreshold])

  const handleTouchMove = React.useCallback((e: TouchEvent) => {
    if (!isMobile || !touchStartRef.current) return

    const touch = e.touches[0]
    const currentX = touch.clientX
    const currentY = touch.clientY
    const deltaX = currentX - touchStartRef.current.x
    const deltaY = currentY - touchStartRef.current.y

    // Prevent vertical scrolling if horizontal swipe is detected
    if (isSwipingRef.current && Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault()
    }
  }, [isMobile])

  const handleTouchEnd = React.useCallback((e: TouchEvent) => {
    if (!isMobile || !touchStartRef.current) return

    const touch = e.changedTouches[0]
    const endX = touch.clientX
    const endY = touch.clientY
    const deltaX = endX - touchStartRef.current.x
    const deltaY = endY - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartRef.current.time

    // Remove visual feedback
    document.body.classList.remove('mobile-swipe-active')

    // Check if it's a valid swipe (not too slow, not too vertical)
    const isValidSwipe =
      Math.abs(deltaX) > threshold &&
      Math.abs(deltaX) > Math.abs(deltaY) * 2 &&
      deltaTime < 500

    if (isValidSwipe) {
      if (deltaX > 0 && onSwipeRight) {
        // Swipe right (open sidebar)
        onSwipeRight()
      } else if (deltaX < 0 && onSwipeLeft) {
        // Swipe left (close sidebar)
        onSwipeLeft()
      }
    }

    touchStartRef.current = null
    isSwipingRef.current = false
  }, [isMobile, threshold, onSwipeLeft, onSwipeRight])

  const handleTouchCancel = React.useCallback(() => {
    // Clean up on touch cancel
    document.body.classList.remove('mobile-swipe-active')
    touchStartRef.current = null
    isSwipingRef.current = false
  }, [])

  React.useEffect(() => {
    if (!isMobile) return

    const options = { passive: false }

    document.addEventListener('touchstart', handleTouchStart, options)
    document.addEventListener('touchmove', handleTouchMove, options)
    document.addEventListener('touchend', handleTouchEnd, options)
    document.addEventListener('touchcancel', handleTouchCancel, options)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('touchcancel', handleTouchCancel)
      // Clean up any remaining classes
      document.body.classList.remove('mobile-swipe-active')
    }
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel])

  return { isMobile }
}
