'use client'

import { toast as shadcnToast, Toaster } from '@/components/ui/toast'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}

export function useToast() {
  return {
    toast: (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      shadcnToast.add({ title: message, type })
    },
  }
}
