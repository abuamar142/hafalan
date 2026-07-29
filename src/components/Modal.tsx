'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export default function Modal({ open, onClose, title, children, className }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = 'unset'
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose()
      }}
    >
      <div 
        className={cn(
          "relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[var(--radius-lg)] bg-surface p-6 shadow-xl border border-border/50 animate-in zoom-in-95 duration-200",
          className
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold tracking-tight text-text">{title}</h2>
          <button 
            onClick={onClose}
            className="rounded-full p-1.5 text-text-muted hover:bg-card hover:text-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {children}
      </div>
    </div>
  )
}
