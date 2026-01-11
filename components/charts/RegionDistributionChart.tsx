'use client'

import { memo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { RegionCount } from '@/data/dummyAnalytics'

interface RegionDistributionChartProps {
  data: RegionCount[]
  title?: string
}

const RISK_COLORS = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981',
}

function RegionDistributionChartComponent({ data, title = 'Regional Distribution' }: RegionDistributionChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-56 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="region"
                tick={{ fontSize: 9, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '11px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value, name, props) => {
                  const item = props.payload as RegionCount
                  return [
                    <span key="value">
                      {value} reports
                      <span className={`ml-2 text-xs ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ({item.change >= 0 ? '+' : ''}{item.change}%)
                      </span>
                    </span>,
                    'Reports'
                  ]
                }}
              />
              <Bar dataKey="reports" radius={[0, 4, 4, 0]} barSize={20}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.riskLevel]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-4 sm:gap-6 mt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: RISK_COLORS.high }} />
            <span className="text-gray-600">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: RISK_COLORS.medium }} />
            <span className="text-gray-600">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: RISK_COLORS.low }} />
            <span className="text-gray-600">Low</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const RegionDistributionChart = memo(RegionDistributionChartComponent)
