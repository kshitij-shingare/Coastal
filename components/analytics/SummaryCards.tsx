'use client'

import { Card } from '@/components/ui/Card'
import type { SummaryMetrics } from '@/data/dummyAnalytics'

interface SummaryCardsProps {
  metrics: SummaryMetrics
}

export function SummaryCards({ metrics }: SummaryCardsProps) {
  const cards = [
    {
      label: 'Reports',
      value: metrics.reportsToday,
      previousValue: metrics.reportsYesterday,
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'High Risk',
      value: metrics.highRiskZones,
      change: metrics.highRiskZonesChange,
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      isRisk: true,
    },
    {
      label: 'Verified',
      value: `${metrics.verifiedPercent}%`,
      change: metrics.verifiedPercentChange,
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Top Hazard',
      value: metrics.topHazardCount,
      subtitle: metrics.topHazard,
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  const calculateChange = (current: number, previous: number) => {
    return Math.round(((current - previous) / previous) * 100)
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const change = card.change ?? (card.previousValue 
          ? calculateChange(card.value as number, card.previousValue) 
          : 0)
        const isPositive = change > 0
        const isNegative = change < 0
        const trendColor = card.isRisk
          ? isPositive ? 'text-red-600' : isNegative ? 'text-green-600' : 'text-gray-500'
          : isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'

        return (
          <Card key={card.label} padding="sm" className="relative overflow-hidden">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-0.5 truncate">{card.label}</p>
                <p className={`text-xl sm:text-2xl font-bold ${card.color}`}>{card.value}</p>
                {card.subtitle && (
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{card.subtitle}</p>
                )}
              </div>
              <div className={`p-1.5 sm:p-2 rounded-lg ${card.bgColor} shrink-0`}>
                <div className={card.color}>{card.icon}</div>
              </div>
            </div>
            
            {/* Trend indicator */}
            <div className={`flex items-center gap-1 mt-2 text-xs ${trendColor}`}>
              {isPositive ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : isNegative ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              ) : null}
              <span className="truncate">
                {change === 0 ? 'No change' : `${Math.abs(change)}%`}
              </span>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
