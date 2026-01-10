import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface Props {
  result?: {
    credibility: 'high' | 'medium' | 'low'
    analysis: string
  }
}

export default function VerificationResult({ result }: Props) {
  if (!result) return null

  const variantMap = {
    high: 'safe' as const,
    medium: 'warning' as const,
    low: 'alert' as const,
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-2">Verification Result</h3>
      <div className="flex items-center gap-2 mb-2">
        <span>Credibility:</span>
        <Badge variant={variantMap[result.credibility]}>{result.credibility}</Badge>
      </div>
      <p className="text-gray-600">{result.analysis}</p>
    </Card>
  )
}
