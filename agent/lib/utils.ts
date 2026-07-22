import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const target = new Date(date)
  const diffMs = now.getTime() - target.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return formatDate(date)
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 3) + '...'
}

export function statusColor(status: string): string {
  switch (status) {
    case 'active':
    case 'running':
    case 'connected':
    case 'completed':
    case 'ok':
      return 'text-green-600 bg-green-50 border-green-300'
    case 'idle':
    case 'stopped':
    case 'disconnected':
      return 'text-yellow-600 bg-yellow-50 border-yellow-300'
    case 'error':
    case 'errored':
      return 'text-red-600 bg-red-50 border-red-300'
    case 'creating':
      return 'text-blue-600 bg-blue-50 border-blue-300'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-300'
  }
}

export function statusDot(status: string): string {
  switch (status) {
    case 'active':
    case 'running':
    case 'connected':
    case 'completed':
      return 'bg-green-500'
    case 'idle':
    case 'stopped':
    case 'disconnected':
      return 'bg-yellow-500'
    case 'error':
    case 'errored':
      return 'bg-red-500'
    case 'creating':
      return 'bg-blue-500 animate-pulse'
    default:
      return 'bg-gray-400'
  }
}
