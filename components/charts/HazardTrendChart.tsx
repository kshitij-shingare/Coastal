'use client'

import { memo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { HazardCount } from '@/data/dummyAnalytics'

interface HazardTrendChartProps {
  data: HazardCount[]
  title?: string
}

const HAZARD_COLORS = {
  flood: { stroke: '#3B82F6', fill: '#3B82F6' },
  ripCurrent: { stroke: '#EF4444', fill: '#EF4444' },
  erosion: { stroke: '#F59E0B', fill: '#F59E0B' },
  stormSurge: { stroke: '#8B5CF6', fill: '#8B5CF6' },
  tsunami: { stroke: '#06B6D4', fill: '#06B6D4' },
}

function HazardTrendChartComponent({ data, title = 'Hazard Trends' }: HazardTrendChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-56 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
              <defs>
                {Object.entries(HAZARD_COLORS).map(([key, colors]) => (
                  <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.fill} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.fill} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '11px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                iconType="circle"
                iconSize={6}
              />
              <Area
                type="monotone"
                dataKey="flood"
                name="Flood"
                stroke={HAZARD_COLORS.flood.stroke}
                fill={`url(#gradient-flood)`}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="ripCurrent"
                name="Rip Current"
                stroke={HAZARD_COLORS.ripCurrent.stroke}
                fill={`url(#gradient-ripCurrent)`}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="erosion"
                name="Erosion"
                stroke={HAZARD_COLORS.erosion.stroke}
                fill={`url(#gradient-erosion)`}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="stormSurge"
                name="Storm"
                stroke={HAZARD_COLORS.stormSurge.stroke}
                fill={`url(#gradient-stormSurge)`}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export const HazardTrendChart = memo(HazardTrendChartComponent)
