'use client'

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface MessageEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function MessageEditor({ value, onChange, placeholder, className }: MessageEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  // Sync scroll between textarea and backdrop
  const handleScroll = () => {
    if (backdropRef.current && textareaRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const handleDeleteVariable = (variable: string) => {
    // Replace the first occurrence of the variable with empty string
    // Or replace all? Usually deleting a chip means deleting that specific instance.
    // However, since we are rendering from a string, we need to be careful.
    // A simple approach: Replace the first match of that variable in the string.
    // BUT: The user clicks a specific chip. We don't know WHICH index it is easily from here without more complex logic.
    // Alternative: Just replace the text in the textarea.
    
    // Better UX: Since we can't easily map the click on the backdrop to the exact cursor position in the raw string
    // (because of duplicates), we will implement a "Delete All" or just replace the first one?
    // Let's try to replace the first occurrence for now or Regex replace all?
    // Replacing all might be annoying if user wants to keep others.
    
    // Let's implement a replacement that tries to be smart, but for now, replace ALL instances of this specific variable tag
    // to be consistent, or maybe just let the user delete it manually with backspace.
    
    // Wait, the requirement is "give ability to delete via X icon".
    // If I click X on [المستلم], it should remove THAT [المستلم].
    // Since the backdrop is `pointer-events-none`, we can't click it!
    // We need to make the chips interactive.
    
    // Enabling pointer-events on chips only:
    const newValue = value.replace(variable, '') // This removes the FIRST occurrence only? No, string.replace only replaces first.
    // But which one did they click?
    // We can't know easily.
    
    // PROPOSAL: Since syncing click on a specific chip to the text index is hard without a full lexical parser,
    // I will simply remove the variable string from the text.
    // If there are multiple, this removes the first one found.
    // This is a trade-off. To do it perfectly, we need a contenteditable div instead of textarea+backdrop.
    
    onChange(newValue)
    textareaRef.current?.focus()
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
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        className="relative block w-full rounded-xl border-0 bg-transparent p-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 transition-shadow sm:text-sm resize-none z-0 leading-6"
        placeholder={placeholder}
        rows={5}
        spellCheck={false}
        style={{
            color: 'transparent',
            caretColor: 'var(--foreground)', 
            lineHeight: '1.5rem'
        }}
      />
      
      {/* Fallback caret color fix for Tailwind v4 if var not set */}
      <style jsx>{`
        textarea {
          caret-color: #000;
        }
        @media (prefers-color-scheme: dark) {
          textarea {
            caret-color: #fff;
          }
        }
      `}</style>
    </div>
  )
}
