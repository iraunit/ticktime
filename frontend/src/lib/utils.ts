import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  // If already absolute
  if (/^https?:\/\//i.test(path)) return path
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  // Ensure no double slashes
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}
