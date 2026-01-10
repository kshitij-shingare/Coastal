'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

interface WeatherData {
  temp: number
  condition: string
  icon: string
  tideStatus: 'high' | 'low' | 'rising' | 'falling'
  tideTime: string
  windSpeed: number
  waveHeight: number
}

const initialWeather: WeatherData = {
  temp: 28,
  condition: 'Partly Cloudy',
  icon: '⛅',
  tideStatus: 'rising',
  tideTime: '2:30 PM',
  windSpeed: 18,
  waveHeight: 1.2,
}

export function HeroSection() {
  const { isLoggedIn } = useAuth()
  const [weather] = useState<WeatherData>(initialWeather)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const greeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-4 md:p-6 lg:p-8 text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="wave-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M0 10 Q5 5, 10 10 T20 10" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wave-pattern)" />
        </svg>
      </div>

      <div className="relative z-10">
        {/* Top Row - Greeting & Weather */}
        <div className="flex flex-col gap-4 mb-4 md:mb-6">
          {/* Greeting */}
          <div>
            <p className="text-blue-200 text-xs md:text-sm font-medium mb-0.5">{greeting()}</p>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Coastal Safety Dashboard</h1>
            <p className="text-blue-100 mt-1 md:mt-2 text-xs md:text-sm lg:text-base max-w-md">
              Real-time hazard monitoring and community-verified reports
            </p>
          </div>

          {/* Weather Widget - Compact on mobile */}
          <div className="flex items-center gap-3 md:gap-4 bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-4">
            <div className="text-2xl md:text-4xl">{weather.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1 md:gap-2">
                <span className="text-xl md:text-3xl font-bold">{weather.temp}°</span>
                <span className="text-blue-200 text-xs md:text-sm truncate">{weather.condition}</span>
              </div>
              <div className="flex gap-3 md:gap-4 mt-0.5 md:mt-1 text-xs text-blue-200">
                <span className="flex items-center gap-1">
                  💨 {weather.windSpeed} km/h
                </span>
                <span className="flex items-center gap-1">
                  🌊 {weather.waveHeight}m
                </span>
              </div>
            </div>
            <div className="text-right border-l border-white/20 pl-3 md:pl-4">
              <div className="text-xs text-blue-200">Tide</div>
              <div className="font-semibold text-sm md:text-base capitalize flex items-center gap-1">
                {weather.tideStatus === 'rising' && '↑'}
                {weather.tideStatus === 'falling' && '↓'}
                {weather.tideStatus}
              </div>
              <div className="text-xs text-blue-200">{weather.tideTime}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions - Full width buttons on mobile */}
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
          <Link href={isLoggedIn ? '/report' : '/login'} className="flex-1 sm:flex-none">
            <Button className="w-full sm:w-auto bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-lg text-sm md:text-base">
              <svg className="w-4 h-4 md:w-5 md:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Report Hazard
            </Button>
          </Link>
          <Link href="/map" className="flex-1 sm:flex-none">
            <Button variant="secondary" className="w-full sm:w-auto bg-white/20 text-white border-white/30 hover:bg-white/30 text-sm md:text-base">
              <svg className="w-4 h-4 md:w-5 md:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Safety Map
            </Button>
          </Link>
          <Link href="/report-feed" className="flex-1 sm:flex-none">
            <Button variant="secondary" className="w-full sm:w-auto bg-white/20 text-white border-white/30 hover:bg-white/30 text-sm md:text-base">
              <svg className="w-4 h-4 md:w-5 md:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              Feed
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
