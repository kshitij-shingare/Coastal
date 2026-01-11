'use client'

import { useState } from 'react'
import { Tooltip } from '@/components/ui/Tooltip'
import { useToast } from '@/components/ui/Toast'
import type { FeedPost } from '@/types/feed'

interface FeedCardProps {
  post: FeedPost
  userVote?: 'up' | 'down' | null
  onVote: (postId: string, vote: 'up' | 'down') => void
  onCommentClick: (post: FeedPost) => void
  isAuthenticated: boolean
  onAuthRequired: () => void
  distance?: number // in km
  onMarkResolved?: (postId: string) => void
}

const categoryConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  Weather: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
  },
  Ocean: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
  },
  Infrastructure: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  Evacuation: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
}

function formatTimeAgo(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m away`
  return `${km.toFixed(1)}km away`
}

function getReliabilityInfo(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 0.9) return { label: 'Trusted', color: 'text-green-700', bgColor: 'bg-green-100' }
  if (score >= 0.7) return { label: 'Verified', color: 'text-blue-700', bgColor: 'bg-blue-100' }
  return { label: 'New', color: 'text-gray-600', bgColor: 'bg-gray-100' }
}

function getUrgencyLevel(post: FeedPost): { level: 'critical' | 'high' | 'moderate' | 'low'; color: string } {
  const netVotes = post.upvotes - post.downvotes
  const hoursAgo = (Date.now() - new Date(post.timestamp).getTime()) / (1000 * 60 * 60)
  
  if (post.status === 'resolved') return { level: 'low', color: 'bg-gray-400' }
  if (post.hazardCategory === 'Evacuation' && hoursAgo < 6) return { level: 'critical', color: 'bg-red-500' }
  if (netVotes > 50 && hoursAgo < 12) return { level: 'critical', color: 'bg-red-500' }
  if (netVotes > 20 && hoursAgo < 24) return { level: 'high', color: 'bg-orange-500' }
  if (netVotes > 5) return { level: 'moderate', color: 'bg-amber-500' }
  return { level: 'low', color: 'bg-gray-400' }
}

export function FeedCard({
  post,
  userVote,
  onVote,
  onCommentClick,
  isAuthenticated,
  onAuthRequired,
  distance,
  onMarkResolved,
}: FeedCardProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const toast = useToast()
  
  const isResolved = post.status === 'resolved'
  const categoryStyle = categoryConfig[post.hazardCategory]
  const reliability = getReliabilityInfo(post.authorReliabilityScore)
  const urgency = getUrgencyLevel(post)
  const netVotes = post.upvotes - post.downvotes

  const handleVote = async (vote: 'up' | 'down') => {
    if (!isAuthenticated) {
      onAuthRequired()
      return
    }
    if (isVoting || userVote === vote) return
    
    setIsVoting(true)
    await new Promise(resolve => setTimeout(resolve, 150))
    onVote(post.id, vote)
    setIsVoting(false)
  }

  const handleShare = async () => {
    const shareText = `${post.title} - ${post.location.name}`
    const shareUrl = `${window.location.origin}/report-feed?post=${post.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text: shareText, url: shareUrl })
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
      toast.success('Link copied to clipboard')
    }
    setShowActions(false)
  }

  const handleMarkResolved = () => {
    if (!isAuthenticated) {
      onAuthRequired()
      return
    }
    onMarkResolved?.(post.id)
    setShowActions(false)
  }

  return (
    <article
      className={`
        relative bg-white rounded-xl border overflow-hidden transition-all duration-200
        ${isResolved 
          ? 'opacity-60 border-gray-200 bg-gray-50' 
          : 'border-[var(--border-soft)] hover:border-[var(--info-blue)] hover:shadow-md'
        }
      `}
      aria-label={`${post.title} - ${post.status}`}
    >
      {/* Urgency Indicator Bar */}
      {!isResolved && urgency.level !== 'low' && (
        <div className={`h-1 ${urgency.color}`} />
      )}

      <div className="p-3 sm:p-4">
        {/* Top Row: Category + Status + Trust */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Category Badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${categoryStyle.bg} ${categoryStyle.text}`}>
              {categoryStyle.icon}
              <span className="hidden xs:inline">{post.hazardCategory}</span>
            </span>
            
            {/* Status Badge */}
            {isResolved ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-200 text-gray-600">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden xs:inline">Resolved</span>
              </span>
            ) : urgency.level === 'critical' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-red-600 text-white animate-pulse">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                URGENT
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                Active
              </span>
            )}

            {/* Distance Badge */}
            {distance !== undefined && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                {formatDistance(distance)}
              </span>
            )}
          </div>
          
          {/* Actions Menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="More actions"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {showActions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-[var(--border-soft)] py-1 z-20 min-w-[120px]">
                  <button
                    onClick={handleShare}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>
                  {!isResolved && onMarkResolved && (
                    <button
                      onClick={handleMarkResolved}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Resolve
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className={`text-base sm:text-lg font-bold mb-1.5 leading-tight ${isResolved ? 'text-gray-500' : 'text-[var(--text-primary)]'}`}>
          {post.title}
        </h3>

        {/* Media Placeholder */}
        {post.mediaUrl && (
          <div className="mb-2 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 h-32 sm:h-44 flex items-center justify-center">
            <div className="text-gray-400 text-center">
              <svg className="w-8 h-8 mx-auto mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs">Media</span>
            </div>
          </div>
        )}

        {/* Description */}
        <p className={`text-sm mb-2 leading-relaxed line-clamp-2 ${isResolved ? 'text-gray-400' : 'text-[var(--text-secondary)]'}`}>
          {post.description}
        </p>

        {/* Meta Row: Location + Time + Trust */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mb-3">
          <span className="flex items-center gap-1 text-[var(--text-secondary)]">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate max-w-[140px] sm:max-w-[180px]">{post.location.name}</span>
          </span>
          <span className="flex items-center gap-1 text-[var(--text-secondary)]">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTimeAgo(post.timestamp)}
          </span>
          <Tooltip content={`${Math.round(post.authorReliabilityScore * 100)}% validation rate`}>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${reliability.bgColor} ${reliability.color}`}>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {reliability.label}
            </span>
          </Tooltip>
        </div>

        {/* Bottom Row: Votes + Comments */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-soft)]">
          {/* Vote Buttons - Compact on mobile */}
          <div className="flex items-center">
            <button
              onClick={() => handleVote('up')}
              disabled={isVoting}
              className={`
                p-1.5 sm:p-2 rounded-l-lg border transition-all
                ${userVote === 'up' 
                  ? 'bg-green-100 border-green-300 text-green-700' 
                  : 'border-gray-200 hover:bg-green-50 hover:border-green-200 text-gray-500 hover:text-green-600'
                }
                ${isVoting ? 'opacity-50' : ''}
              `}
              aria-label="Upvote"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill={userVote === 'up' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            
            <div className={`
              px-2 sm:px-3 py-1.5 sm:py-2 border-y text-center font-bold text-xs sm:text-sm min-w-[2.5rem] sm:min-w-[3rem]
              ${netVotes > 10 ? 'bg-green-50 border-green-200 text-green-700' 
                : netVotes < -5 ? 'bg-red-50 border-red-200 text-red-600' 
                : 'bg-gray-50 border-gray-200 text-gray-600'}
            `}>
              {netVotes > 0 ? `+${netVotes}` : netVotes}
            </div>
            
            <button
              onClick={() => handleVote('down')}
              disabled={isVoting}
              className={`
                p-1.5 sm:p-2 rounded-r-lg border transition-all
                ${userVote === 'down' 
                  ? 'bg-red-100 border-red-300 text-red-700' 
                  : 'border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-500 hover:text-red-600'
                }
                ${isVoting ? 'opacity-50' : ''}
              `}
              aria-label="Downvote"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill={userVote === 'down' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Comments Button */}
          <button
            onClick={() => onCommentClick(post)}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-[var(--text-secondary)] transition-all"
            aria-label={`${post.commentsCount} comments`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs sm:text-sm font-medium">{post.commentsCount}</span>
          </button>
        </div>
      </div>
    </article>
  )
}
