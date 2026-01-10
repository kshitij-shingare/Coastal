'use client'

import { Card } from '@/components/ui/Card'

interface Contact {
  name: string
  number: string
  icon: string
  color: string
}

const emergencyContacts: Contact[] = [
  { name: 'Coast Guard', number: '1800-180-4567', icon: '🚢', color: 'bg-blue-500' },
  { name: 'Emergency', number: '112', icon: '🚨', color: 'bg-red-500' },
  { name: 'Disaster Mgmt', number: '1070', icon: '⚠️', color: 'bg-amber-500' },
  { name: 'Police', number: '100', icon: '👮', color: 'bg-indigo-500' },
]

export function EmergencyContacts() {
  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-3 md:p-4">
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <div className="w-7 h-7 md:w-8 md:h-8 bg-red-500 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-sm md:text-base">Emergency Contacts</h3>
          <p className="text-xs text-slate-400">Tap to call</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {emergencyContacts.map((contact) => (
          <a
            key={contact.name}
            href={`tel:${contact.number.replace(/-/g, '')}`}
            className="flex items-center gap-2 p-2 md:p-2.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors group"
          >
            <span className="text-base md:text-lg">{contact.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-300 truncate">{contact.name}</p>
              <p className="text-xs md:text-sm font-semibold group-hover:text-blue-300 transition-colors truncate">
                {contact.number}
              </p>
            </div>
          </a>
        ))}
      </div>
    </Card>
  )
}
