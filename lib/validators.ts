import { Report } from '@/types/report'

export function validateReport(data: Partial<Report>): string[] {
  const errors: string[] = []
  if (!data.title?.trim()) errors.push('Title is required')
  if (!data.hazardType) errors.push('Hazard type is required')
  if (!data.location) errors.push('Location is required')
  return errors
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
