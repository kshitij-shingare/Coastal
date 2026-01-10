'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="heading-l">Analytics Dashboard</h1>
          <Badge variant="neutral">Beta</Badge>
        </div>
        <p className="small-text">
          View hazard trends, regional statistics, and historical data.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Reports', value: '156', color: 'text-[var(--info-blue)]' },
          { label: 'Verified', value: '142', color: 'text-[var(--safe-green)]' },
          { label: 'Pending', value: '14', color: 'text-[var(--warning-orange)]' },
          { label: 'High Risk', value: '8', color: 'text-[var(--alert-red)]' },
        ].map(stat => (
          <Card key={stat.label} padding="sm">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="small-text">{stat.label}</p>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hazard Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-[var(--bg-muted)] rounded-lg border-2 border-dashed border-[var(--border-soft)] flex items-center justify-center">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <p className="small-text">Trend chart placeholder</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regional Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-[var(--bg-muted)] rounded-lg border-2 border-dashed border-[var(--border-soft)] flex items-center justify-center">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                <p className="small-text">Regional chart placeholder</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Link href="/report">
          <Button>New Report</Button>
        </Link>
        <Link href="/social-verify">
          <Button variant="secondary">Verify Post</Button>
        </Link>
      </div>
    </div>
  )
}
