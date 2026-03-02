'use client'

import { useRef, forwardRef, useImperativeHandle } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface MessageEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export const MessageEditor = forwardRef<HTMLTextAreaElement, MessageEditorProps>(({ value, onChange, placeholder, className }, ref) => {
  const localRef = useRef<HTMLTextAreaElement>(null)
  
  useImperativeHandle(ref, () => localRef.current!)

  const backdropRef = useRef<HTMLDivElement>(null)

  // Sync scroll between textarea and backdrop
  const handleScroll = () => {
    if (backdropRef.current && localRef.current) {
      backdropRef.current.scrollTop = localRef.current.scrollTop
    }
  }

  // Highlight logic for [variables]
  const renderHighlightedText = (text: string) => {
    if (!text) return null
    // Split by variables like [word]
    // Regex: Capture anything between brackets including brackets
    const parts = text.split(/(\[.*?\])/g)
    
    return parts.map((part, index) => {
      // If it matches [anything], render as chip
      if (part.match(/^\[.*\]$/)) {
        return (
          <span 
            key={index} 
            className="inline-flex items-center bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded px-1 py-0 mx-0.5 text-sm font-semibold border border-blue-200 dark:border-blue-800/50 align-middle transform -translate-y-[1px] pointer-events-auto cursor-default z-20"
            style={{ lineHeight: '1.2' }}
          >
            {part}
            {/* Pseudo-delete button (visual only because real deletion logic is complex with textarea) 
                Actually, we can't easily click this because it's behind the textarea usually?
                No, z-index can bring it front? But then textarea input is blocked there.
                
                If we move chips to FRONT (z-20) and textarea (z-10), then user CANNOT click text cursor inside the chip to edit it manually.
                But they CAN click the X.
                
                This creates a UX conflict: Editable text vs Clickable Chip.
                Standard solution: ContentEditable.
                
                HACK solution for this task:
                Make the chip visually appear, and the X button is clickable.
                The chip body passes clicks through to textarea (pointer-events-none), but the X button catches them (pointer-events-auto).
            */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation() // Prevent textarea focus stealing if any
                // We need to find WHICH occurrence this is.
                // We can count occurrences before this index.
                // Re-calculating index is tricky in map.
                
                // Simplified: Remove the first instance of this exact string for now.
                onChange(value.replace(part, ''))
              }}
              className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors pointer-events-auto cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className={cn(
      "relative group font-sans rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 transition-shadow focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent",
      className
    )}>
      {/* Backdrop for highlighting */}
      <div
        ref={backdropRef}
        className="absolute inset-0 p-4 whitespace-pre-wrap break-words text-sm overflow-hidden bg-transparent z-10 text-gray-900 dark:text-white pointer-events-none"
        aria-hidden="true"
        style={{
          lineHeight: '1.5rem'
        }}
      >
        {renderHighlightedText(value) || <span className="opacity-0">placeholder</span>}
        <br />
      </div>

      {/* Actual Textarea */}
      <textarea
        ref={localRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        placeholder={placeholder}
        className="relative w-full h-40 p-4 bg-transparent border-none focus:ring-0 text-sm text-transparent caret-gray-900 dark:caret-white resize-none z-20 whitespace-pre-wrap break-words overflow-auto"
        style={{
          lineHeight: '1.5rem'
        }}
      />
    </div>
  )
})

MessageEditor.displayName = 'MessageEditor'
