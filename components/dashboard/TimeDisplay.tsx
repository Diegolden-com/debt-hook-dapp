'use client'

import { useState, useEffect } from 'react'

interface TimeDisplayProps {
  timestamp: string
  format?: 'remaining' | 'countdown'
}

export function TimeDisplay({ timestamp, format = 'remaining' }: TimeDisplayProps) {
  const [displayTime, setDisplayTime] = useState<string>('')

  useEffect(() => {
    const updateDisplay = () => {
      const now = new Date()
      const target = new Date(timestamp)
      const remaining = target.getTime() - now.getTime()

      if (format === 'remaining') {
        if (remaining <= 0) {
          setDisplayTime('Expired')
        } else {
          const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
          const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          setDisplayTime(days > 0 ? `${days}d ${hours}h` : `${hours}h`)
        }
      } else if (format === 'countdown') {
        if (remaining <= 0) {
          setDisplayTime('LIQUIDATED')
        } else {
          const hours = Math.floor(remaining / (1000 * 60 * 60))
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
          
          if (hours > 0) {
            setDisplayTime(`${hours}h ${minutes}m ${seconds}s`)
          } else {
            setDisplayTime(`${minutes}m ${seconds}s`)
          }
        }
      }
    }

    // Initial update
    updateDisplay()

    // Update every second
    const timer = setInterval(updateDisplay, 1000)

    return () => clearInterval(timer)
  }, [timestamp, format])

  return <>{displayTime}</>
}