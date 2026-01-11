'use client'

import { useState, useEffect, useMemo } from 'react'
import { AlertBanner } from '@/components/home/AlertBanner'
import { StatsCards } from '@/components/home/StatsCards'
import { ReportFilters } from '@/components/home/ReportFilters'
import { ReportFeed } from '@/components/home/ReportFeed'
import { TipsWidget } from '@/components/home/TipsWidget'
import { HazardTrendChart } from '@/components/charts/HazardTrendChart'
import { RegionRiskChart } from '@/components/charts/RegionRiskChart'
import { SkeletonStats, SkeletonChart } from '@/components/ui/Skeleton'
import { dummyReports, type DummyReport } from '@/data/dummyReports'
import { hazardTrendData } from '@/data/dummyAnalytics'
import { useReportStore } from '@/store/useReportStore'
import { VISIBILITY_THRESHOLD } from '@/types/report'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [selectedHazard, setSelectedHazard] = useState('all')
  const [selectedRegion, setSelectedRegion] = useState('All Regions')
  const [selectedTime, setSelectedTime] = useState('24h')

  // Get reports from store
  const storeReports = useReportStore((state) => state.reports)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  // Combine store reports with dummy reports and apply filters
  const filteredReports = useMemo(() => {
    // Convert store reports to DummyReport format for compatibility
    const convertedStoreReports: DummyReport[] = storeReports
      .filter(r => r.status === 'verified' && r.confidence >= VISIBILITY_THRESHOLD)
      .map(r => ({
        id: r.id,
        hazardType: r.hazardType as DummyReport['hazardType'],
        region: r.region,
        location: r.location.name,
        timestamp: r.timestamp,
        confidence: r.confidence,
        summary: r.aiSummary,
        hasMedia: r.hasMedia,
        severity: r.severity,
      }))

    // Combine with dummy reports (store reports first - newest)
    let reports = [...convertedStoreReports, ...dummyReports]

    // Apply hazard filter
    if (selectedHazard !== 'all') {
      reports = reports.filter((r) => r.hazardType === selectedHazard)
    }

    // Apply region filter
    if (selectedRegion !== 'All Regions') {
      reports = reports.filter((r) => r.region === selectedRegion)
    }

    // Apply time filter
    const now = new Date()
    const cutoff = new Date()
    if (selectedTime === '24h') {
      cutoff.setHours(now.getHours() - 24)
    } else if (selectedTime === '7d') {
      cutoff.setDate(now.getDate() - 7)
    } else {
      cutoff.setDate(now.getDate() - 30)
    }

    reports = reports.filter((r) => new Date(r.timestamp) >= cutoff)

    return reports
  }, [storeReports, selectedHazard, selectedRegion, selectedTime])

  // Calculate dynamic stats
  const stats = useMemo(() => {
    const visibleStoreReports = storeReports.filter(
      r => r.status === 'verified' && r.confidence >= VISIBILITY_THRESHOLD
    )
    const totalReports = dummyReports.length + visibleStoreReports.length
    const highRiskCount = dummyReports.filter(r => r.severity === 'high').length +
      visibleStoreReports.filter(r => r.severity === 'high').length
    
    return {
      totalReports,
      highRiskCount,
      newReportsToday: visibleStoreReports.length,
    }
  }, [storeReports])

  return (
    <div className="space-y-6">
      <AlertBanner
        severity="high"
        title="Active Flood Warning"
        message="Flooding reported in Marina Bay Area. Avoid low-lying coastal roads and monitor official updates."
      />

      {isLoading ? (
        <SkeletonStats />
      ) : (
        <StatsCards extraReports={stats.newReportsToday} />
      )}

      <ReportFilters
        selectedHazard={selectedHazard}
        selectedRegion={selectedRegion}
        selectedTime={selectedTime}
        onHazardChange={setSelectedHazard}
        onRegionChange={setSelectedRegion}
        onTimeChange={setSelectedTime}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ReportFeed reports={filteredReports} isLoading={isLoading} />
        </div>
        <div className="space-y-6">
          <TipsWidget />
        </div>
      </div>

      <section>
        <h2 className="heading-m mb-4">Trends & Analytics</h2>
        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <HazardTrendChart data={hazardTrendData['7d']} title="Hazard Trends (7 Days)" />
            <RegionRiskChart />
          </div>
        )}
      </section>
    </div>
  )
}
