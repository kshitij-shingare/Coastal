'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function SocialVerifyPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <section>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="heading-l">Social Media Verification</h1>
          <Badge variant="info">AI Powered</Badge>
        </div>
        <p className="small-text">
          Verify the credibility of social media posts about coastal hazards.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Verify Post</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-12 bg-[var(--bg-muted)] rounded-lg border-2 border-dashed border-[var(--border-soft)] flex items-center justify-center">
              <span className="small-text">Social media URL input placeholder</span>
            </div>

            <Button>Verify Post</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verification Result</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 bg-[var(--bg-muted)] rounded-lg border-2 border-dashed border-[var(--border-soft)] flex items-center justify-center">
            <div className="text-center">
              <svg className="w-10 h-10 mx-auto mb-2 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="small-text">Verification results will appear here</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link href="/analytics">
          <Button variant="secondary">View Analytics</Button>
        </Link>
        <Link href="/report">
          <Button variant="secondary">Report Hazard</Button>
        </Link>
      </div>
    </div>
  )
}
