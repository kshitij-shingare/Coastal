'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { HeroSection } from '@/components/home/HeroSection'
import { AlertBanner } from '@/components/home/AlertBanner'
import { StatsCards } from '@/components/home/StatsCards'
import { ReportFilters } from '@/components/home/ReportFilters'
import { ReportFeed } from '@/components/home/ReportFeed'
import { TipsWidget } from '@/components/home/TipsWidget'
import { MiniMap } from '@/components/home/MiniMap'
import { EmergencyContacts } from '@/components/home/EmergencyContacts'
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

  const storeReports = useReportStore((state) => state.reports)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const filteredReports = useMemo(() => {
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

    let reports = [...convertedStoreReports, ...dummyReports]

    if (selectedHazard !== 'all') {
      reports = reports.filter((r) => r.hazardType === selectedHazard)
    }

    if (selectedRegion !== 'All Regions') {
      reports = reports.filter((r) => r.region === selectedRegion)
    }

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

  const stats = useMemo(() => {
    const visibleStoreReports = storeReports.filter(
      r => r.status === 'verified' && r.confidence >= VISIBILITY_THRESHOLD
    )
    return {
      newReportsToday: visibleStoreReports.length,
    }
  }, [storeReports])

  const clearFilters = () => {
    setSelectedHazard('all')
    setSelectedRegion('All Regions')
    setSelectedTime('24h')
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Hero Section */}
      <HeroSection />

      {/* Active Alert */}
      <AlertBanner
        severity="high"
        title="Active Flood Warning"
        message="Flooding reported in Marina Bay Area. Avoid low-lying coastal roads."
      />

      {/* Stats Cards */}
      {isLoading ? (
        <SkeletonStats />
      ) : (
        <StatsCards extraReports={stats.newReportsToday} />
      )}

      {/* Filters */}
      <ReportFilters
        selectedHazard={selectedHazard}
        selectedRegion={selectedRegion}
        selectedTime={selectedTime}
        onHazardChange={setSelectedHazard}
        onRegionChange={setSelectedRegion}
        onTimeChange={setSelectedTime}
      />

      {/* Main Content - Mobile First Layout */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-12">
        {/* Reports Section - Full width on mobile, 8 cols on desktop */}
        <div className="lg:col-span-8 order-1">
          <ReportFeed 
            reports={filteredReports} 
            isLoading={isLoading} 
            onClearFilters={clearFilters}
            maxItems={6}
          />
        </div>

        {/* Sidebar Widgets - Stack on mobile, 4 cols on desktop */}
        <div className="lg:col-span-4 order-2 space-y-4 md:space-y-6">
          {/* Mini Map */}
          <MiniMap />
          
          {/* Tips Widget */}
          <TipsWidget />
          
          {/* Emergency Contacts */}
          <EmergencyContacts />
        </div>
      </div>

      {/* Analytics Section */}
      <section className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Trends & Analytics
          </h2>
          <Link 
            href="/analytics" 
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        {isLoading ? (
          <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
            <HazardTrendChart data={hazardTrendData['7d']} title="Hazard Trends (7 Days)" />
            <RegionRiskChart />
          </div>
        )}
      </section>
    </div>
  )
}
