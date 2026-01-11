'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

interface InsightCardsProps {
  insights: string[]
}

export function InsightCards({ insights }: InsightCardsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Key Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 sm:space-y-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="flex gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg border-l-3 border-blue-500"
            >
              <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed">
                {insight}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
