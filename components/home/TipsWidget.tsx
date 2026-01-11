'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'

const safetyTips = [
  {
    icon: '🌊',
    title: 'Rip Current Safety',
    tip: 'If caught in a rip current, swim parallel to shore until free, then swim back at an angle.',
  },
  {
    icon: '🚗',
    title: 'Flood Awareness',
    tip: 'Never drive through flooded roads. Turn around, don\'t drown. Just 6 inches of water can knock you down.',
  },
  {
    icon: '📱',
    title: 'Stay Connected',
    tip: 'Keep emergency contacts saved and enable location services for faster emergency response.',
  },
  {
    icon: '🎒',
    title: 'Emergency Kit',
    tip: 'Prepare an emergency kit with water, flashlight, first aid supplies, and important documents.',
  },
  {
    icon: '🗺️',
    title: 'Know Your Routes',
    tip: 'Familiarize yourself with evacuation routes and meeting points before an emergency occurs.',
  },
  {
    icon: '⚠️',
    title: 'Heed Warnings',
    tip: 'Always follow official warnings and evacuation orders. Your safety is the top priority.',
  },
]

export function TipsWidget() {
  const [currentTip, setCurrentTip] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % safetyTips.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const tip = safetyTips[currentTip]

  return (
    <Card className="bg-blue-50 border-[var(--info-blue)] border-l-4">
      <div className="flex items-start gap-4">
        <span className="text-3xl" role="img" aria-hidden="true">
          {tip.icon}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">
            {tip.title}
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {tip.tip}
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-1.5 mt-4">
        {safetyTips.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentTip(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentTip
                ? 'bg-[var(--info-blue)]'
                : 'bg-[var(--border-soft)] hover:bg-[var(--text-secondary)]'
            }`}
            aria-label={`Go to tip ${index + 1}`}
          />
        ))}
      </div>
    </Card>
  )
}
