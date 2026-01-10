'use client'

import { useState, useCallback } from 'react'
import { dummyReports, type DummyReport } from '@/data/dummyReports'

export function useReports() {
  // Initialize with dummy data directly instead of using useEffect
  const [reports, setReports] = useState<DummyReport[]>(dummyReports)
  const [loading] = useState(false)

  const addReport = useCallback(async (report: Omit<DummyReport, 'id'>) => {
    // TODO: Submit to API
    const newReport: DummyReport = {
      ...report,
      id: Date.now().toString(),
    }
    setReports(prev => [newReport, ...prev])
  }, [])

  return { reports, loading, addReport }
}
