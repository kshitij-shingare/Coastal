'use client'

import { useState, useEffect, useMemo } from 'react'
import { AlertBanner } from '@/components/home/AlertBanner'
import { StatsCards } from '@/components/home/StatsCards'
import { ReportFilters } from '@/components/home/ReportFilters'
import { ReportFeed } from '@/components/home/ReportFeed'
import { TipsWidget } from '@/components/home/TipsWidget'
import { HazardTrendChart } from '@/components/charts/HazardTrendChart'
import { RegionRiskChart } from '@/components/charts/RegionRiskChart'
import { SkeletonCard, SkeletonChart } from '@/components/ui/Skeleton'
import { dummyReports } from '@/data/dummyReports'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [selectedHazard, setSelectedHazard] = useState('all')
  const [selectedRegion, setSelectedRegion] = useState('All Regions')
  const [selectedTime, setSelectedTime] = useState('24h')

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  // Filter reports using useMemo instead of useEffect + setState
  const filteredReports = useMemo(() => {
    let reports = [...dummyReports]

    if (selectedHazard !== 'all') {
      reports = reports.filter((r) => r.hazardType === selectedHazard)
    }

    if (selectedRegion !== 'All Regions') {
      reports = reports.filter((r) => r.region === selectedRegion)
    }

    // Time filtering (simplified for demo)
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
  }, [selectedHazard, selectedRegion, selectedTime])

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      <AlertBanner
        severity="high"
        title="Active Flood Warning"
        message="Flooding reported in Marina Bay Area. Avoid low-lying coastal roads and monitor official updates."
      />

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <StatsCards />
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

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Report Feed - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <ReportFeed reports={filteredReports} isLoading={isLoading} />
        </div>

        {/* Sidebar - Tips Widget */}
        <div className="space-y-6">
          <TipsWidget />
        </div>
      </div>

      {/* Charts Section */}
      <section>
        <h2 className="heading-m mb-4">Trends & Analytics</h2>
        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <HazardTrendChart />
            <RegionRiskChart />
          </div>
        )}
      </section>
    </div>
  )
}
