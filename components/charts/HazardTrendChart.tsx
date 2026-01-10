'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const trendData = [
  { day: 'Mon', flood: 4, ripCurrent: 2, erosion: 1, stormSurge: 0 },
  { day: 'Tue', flood: 3, ripCurrent: 4, erosion: 2, stormSurge: 1 },
  { day: 'Wed', flood: 5, ripCurrent: 3, erosion: 1, stormSurge: 2 },
  { day: 'Thu', flood: 2, ripCurrent: 5, erosion: 3, stormSurge: 1 },
  { day: 'Fri', flood: 6, ripCurrent: 4, erosion: 2, stormSurge: 3 },
  { day: 'Sat', flood: 4, ripCurrent: 6, erosion: 1, stormSurge: 2 },
  { day: 'Sun', flood: 3, ripCurrent: 3, erosion: 2, stormSurge: 1 },
]

export function HazardTrendChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hazard Trends (7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                axisLine={{ stroke: 'var(--border-soft)' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                axisLine={{ stroke: 'var(--border-soft)' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="flood"
                name="Flooding"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="ripCurrent"
                name="Rip Current"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="erosion"
                name="Erosion"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="stormSurge"
                name="Storm Surge"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
