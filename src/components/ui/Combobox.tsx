'use client'

import { useEffect, useState, useRef } from 'react'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'

export interface ComboboxOption {
  id: string | number
  label: string
  sublabel?: string
  searchText: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string | number
  onChange: (val: string) => void
  placeholder: string
  searchPlaceholder?: string
  emptyText?: string
  id?: string
  className?: string
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = 'Cari...',
  emptyText = 'Tidak ditemukan',
  id,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find((o) => String(o.id) === String(value))
  const filteredOptions = options.filter((o) =>
    o.searchText.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={`relative w-full ${className || ''}`} ref={containerRef}>
      <button
        id={id}
        type="button"
        onClick={() => {
          setOpen(!open)
          if (!open) setSearch('')
        }}
        className="flex h-10 w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all hover:bg-card/30 cursor-pointer"
      >
        <span className={selectedOption ? 'text-foreground font-medium truncate' : 'text-muted-foreground truncate'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg flex flex-col animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center border-b border-border/50 px-3 bg-card/25 shrink-0">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground mr-2" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-9 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground text-foreground"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="p-1 rounded-full text-muted-foreground hover:bg-border/40 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1 py-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">{emptyText}</div>
            ) : (
              filteredOptions.map((o) => {
                const isSelected = String(o.id) === String(value)
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      onChange(String(o.id))
                      setOpen(false)
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-primary/5 hover:text-primary cursor-pointer ${
                      isSelected ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{o.label}</div>
                      {o.sublabel && (
                        <div className="text-[11px] text-muted-foreground truncate mt-0.5 font-normal">
                          {o.sublabel}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
