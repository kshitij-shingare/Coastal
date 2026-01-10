'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function SocialInput() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/verify-social', {
        method: 'POST',
        body: JSON.stringify({ url }),
      })
      // TODO: Handle response
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-4 mb-4">
      <label className="block text-sm font-medium mb-2">Social Media URL</label>
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="Paste social media post URL"
          className="flex-1 p-2 border rounded"
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <Button onClick={handleVerify} disabled={loading || !url}>
          {loading ? 'Verifying...' : 'Verify'}
        </Button>
      </div>
    </Card>
  )
}
