'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

interface PinchZoomOptions {
  minScale?: number
  maxScale?: number
  scaleFactor?: number
}

export const usePinchZoom = (options: PinchZoomOptions = {}) => {
  const {
    minScale = 0.5,
    maxScale = 3,
    scaleFactor = 0.01
  } = options

  const [scale, setScale] = useState(1)
  const [isPinching, setIsPinching] = useState(false)
  const lastPinchDistance = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const getPinchDistance = useCallback((touches: TouchList) => {
    if (touches.length < 2) return 0
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      setIsPinching(true)
      lastPinchDistance.current = getPinchDistance(e.touches)
    }
  }, [getPinchDistance])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && isPinching) {
      e.preventDefault()
      const currentDistance = getPinchDistance(e.touches)
      const delta = currentDistance - lastPinchDistance.current
      
      setScale(prevScale => {
        const newScale = prevScale + delta * scaleFactor
        return Math.min(Math.max(newScale, minScale), maxScale)
      })
      
      lastPinchDistance.current = currentDistance
    }
  }, [isPinching, getPinchDistance, scaleFactor, minScale, maxScale])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length < 2) {
      setIsPinching(false)
    }
  }, [])

  const resetZoom = useCallback(() => {
    setScale(1)
  }, [])

  // Double tap to reset zoom
  const lastTapTime = useRef(0)
  const handleDoubleTap = useCallback((e: TouchEvent) => {
    const currentTime = Date.now()
    const tapDelta = currentTime - lastTapTime.current
    
    if (tapDelta < 300 && tapDelta > 0) {
      e.preventDefault()
      resetZoom()
    }
    
    lastTapTime.current = currentTime
  }, [resetZoom])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)
    container.addEventListener('touchstart', handleDoubleTap)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('touchstart', handleDoubleTap)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleDoubleTap])

  return {
    containerRef,
    scale,
    isPinching,
    resetZoom
  }
}