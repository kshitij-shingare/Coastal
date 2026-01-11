'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { TimeFilter } from '@/components/analytics/TimeFilter'
import { SummaryCards } from '@/components/analytics/SummaryCards'
import { InsightCards } from '@/components/analytics/InsightCards'
import { HazardTrendChart } from '@/components/charts/HazardTrendChart'
import { RegionDistributionChart } from '@/components/charts/RegionDistributionChart'
import { RiskTimelineChart } from '@/components/charts/RiskTimelineChart'
import {
  type TimeRange,
  hazardTrendData,
  regionData,
  riskTimelineData,
  summaryMetrics,
  insights,
} from '@/data/dummyAnalytics'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')

  const currentMetrics = summaryMetrics[timeRange]
  const currentHazardData = hazardTrendData[timeRange]
  const currentRegionData = regionData[timeRange]
  const currentRiskData = riskTimelineData[timeRange]
  const currentInsights = insights[timeRange]

  const timeRangeLabels: Record<TimeRange, string> = {
    '24h': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
      {/* Page Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Analytics</h1>
            <Badge variant="info" size="sm">Live</Badge>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Hazard trends for {timeRangeLabels[timeRange].toLowerCase()}
          </p>
          <TimeFilter value={timeRange} onChange={setTimeRange} />
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards metrics={currentMetrics} />

      {/* Main Charts Row */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <HazardTrendChart 
          data={currentHazardData} 
          title="Hazard Trends" 
        />
        <RegionDistributionChart 
          data={currentRegionData} 
          title="Top Affected Regions" 
        />
      </div>

      {/* Secondary Row */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <RiskTimelineChart 
          data={currentRiskData} 
          title="Risk Level Distribution" 
        />
        <InsightCards insights={currentInsights} />
      </div>

      {/* Data Notice - Compact */}
      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
        <p className="text-xs text-amber-700">
          <span className="font-medium">Note:</span> Data is based on citizen reports. For emergencies, contact official authorities.
        </p>
      </div>
    </div>
  )
}
