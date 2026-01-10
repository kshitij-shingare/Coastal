'use client'

import { useState, useEffect } from 'react'
import { dummyReports, type DummyReport } from '@/data/dummyReports'

export function useReports() {
  const [reports, setReports] = useState<DummyReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch from API
    setReports(dummyReports)
    setLoading(false)
  }, [])

  const addReport = async (report: Omit<DummyReport, 'id'>) => {
    // TODO: Submit to API
    const newReport: DummyReport = {
      ...report,
      id: Date.now().toString(),
    }
    setReports(prev => [newReport, ...prev])
  }

  return { reports, loading, addReport }
}
