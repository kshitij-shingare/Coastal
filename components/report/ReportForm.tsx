'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import MediaUploader from './MediaUploader'
import LocationPicker from './LocationPicker'
import { hazardTypes } from '@/data/hazardTypes'

export default function ReportForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hazardType: '',
    location: null as { lat: number; lng: number } | null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Submit to API
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Report Title"
          className="w-full p-2 border rounded"
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
        />
        <select
          className="w-full p-2 border rounded"
          value={formData.hazardType}
          onChange={e => setFormData({ ...formData, hazardType: e.target.value })}
        >
          <option value="">Select Hazard Type</option>
          {hazardTypes.map(type => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
        <textarea
          placeholder="Description"
          className="w-full p-2 border rounded h-32"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
        />
        <LocationPicker onSelect={loc => setFormData({ ...formData, location: loc })} />
        <MediaUploader />
        <Button type="submit" className="w-full">Submit Report</Button>
      </form>
    </Card>
  )
}
