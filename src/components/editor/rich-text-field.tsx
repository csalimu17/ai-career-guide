"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Bold, Italic, List, ListOrdered, Pilcrow, Redo, Underline, Undo } from "lucide-react"

import { Button } from "@/components/ui/button"
import { isRichTextEmpty, normalizeRichTextValue, sanitizeRichTextHtml } from "@/lib/rich-text"
import { cn } from "@/lib/utils"

interface RichTextFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  editorClassName?: string
  minHeightClassName?: string
}

type FormatState = {
  bold: boolean
  italic: boolean
  underline: boolean
  unorderedList: boolean
  orderedList: boolean
}

const DEFAULT_FORMAT_STATE: FormatState = {
  bold: false,
  italic: false,
  underline: false,
  unorderedList: false,
  orderedList: false,
}

export function RichTextField({
  value,
  onChange,
  placeholder = "Start writing here...",
  className,
  editorClassName,
  minHeightClassName = "min-h-[140px]",
}: RichTextFieldProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [formatState, setFormatState] = useState<FormatState>(DEFAULT_FORMAT_STATE)
  const [isFocused, setIsFocused] = useState(false)
  const [isEmpty, setIsEmpty] = useState(isRichTextEmpty(value))

  const normalizedValue = normalizeRichTextValue(value)

  const updateToolbarState = useCallback(() => {
    if (typeof document === "undefined") return

    const selection = document.getSelection()
    const anchorNode = selection?.anchorNode
    const anchorElement =
      anchorNode instanceof HTMLElement
        ? anchorNode
        : anchorNode?.parentElement ?? null

    if (!anchorElement || !editorRef.current?.contains(anchorElement)) {
      return
    }

    const queryState = (command: string) => {
      try {
        return document.queryCommandState(command)
      } catch {
        return false
      }
    }

    setFormatState({
      bold: queryState("bold"),
      italic: queryState("italic"),
      underline: queryState("underline"),
      unorderedList: queryState("insertUnorderedList"),
      orderedList: queryState("insertOrderedList"),
    })
  }, [])

  const emitChange = useCallback(() => {
    if (!editorRef.current) return

    const content = editorRef.current.innerHTML
    const nextValue = isRichTextEmpty(content) ? "" : content
    
    setIsEmpty(!nextValue)
    onChange(nextValue)
    updateToolbarState()
  }, [onChange, updateToolbarState])

  useEffect(() => {
    if (!editorRef.current) return
    if (isFocused) return

    if (editorRef.current.innerHTML !== normalizedValue) {
      editorRef.current.innerHTML = normalizedValue
    }
    setIsEmpty(isRichTextEmpty(normalizedValue))
  }, [isFocused, normalizedValue])

  useEffect(() => {
    if (!isFocused) return

    const handleSelectionChange = () => {
      updateToolbarState()
    }

    document.addEventListener("selectionchange", handleSelectionChange)
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange)
    }
  }, [isFocused, updateToolbarState])

  const executeCommand = useCallback(
    (command: string, commandValue?: string) => {
      if (!editorRef.current) return

      editorRef.current.focus()
      try {
        document.execCommand("styleWithCSS", false, "false")
      } catch {
        // Older browsers may ignore this; semantic tags still work in modern Chrome.
      }
      document.execCommand(command, false, commandValue)
      emitChange()
    },
    [emitChange]
  )

  const toolbarButtonClassName =
    "h-8 shrink-0 rounded-lg border border-border/70 bg-white px-2.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground shadow-sm hover:bg-muted/40 hover:text-primary sm:h-9 sm:px-3 sm:text-[11px]"
  const toolbarIconButtonClassName = "w-8 px-0 sm:w-9 sm:px-0"

  const toolbarToggleClassName = (active: boolean) =>
    cn(toolbarButtonClassName, active && "border-primary/30 bg-primary/10 text-primary")

  return (
    <div className={cn("rounded-[1.35rem] border border-border/70 bg-white shadow-sm", className)}>
      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto border-b border-border/70 px-2 py-2 md:flex-wrap md:overflow-visible md:px-3 md:py-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Bold"
          title="Bold"
          className={cn(toolbarToggleClassName(formatState.bold), toolbarIconButtonClassName)}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => executeCommand("bold")}
        >
          <Bold className="h-3.5 w-3.5" />
          <span className="sr-only">Bold</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Italic"
          title="Italic"
          className={cn(toolbarToggleClassName(formatState.italic), toolbarIconButtonClassName)}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => executeCommand("italic")}
        >
          <Italic className="h-3.5 w-3.5" />
          <span className="sr-only">Italic</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Underline"
          title="Underline"
          className={cn(toolbarToggleClassName(formatState.underline), toolbarIconButtonClassName)}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => executeCommand("underline")}
        >
          <Underline className="h-3.5 w-3.5" />
          <span className="sr-only">Underline</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Bullets"
          title="Bullets"
          className={cn(toolbarToggleClassName(formatState.unorderedList), toolbarIconButtonClassName)}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => executeCommand("insertUnorderedList")}
        >
          <List className="h-3.5 w-3.5" />
          <span className="sr-only">Bullets</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Numbering"
          title="Numbering"
          className={cn(toolbarToggleClassName(formatState.orderedList), toolbarIconButtonClassName)}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => executeCommand("insertOrderedList")}
        >
          <ListOrdered className="h-3.5 w-3.5" />
          <span className="sr-only">Numbering</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Paragraph"
          title="Paragraph"
          className={cn(toolbarButtonClassName, toolbarIconButtonClassName)}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => executeCommand("insertParagraph")}
        >
          <Pilcrow className="h-3.5 w-3.5" />
          <span className="sr-only">Paragraph</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={toolbarButtonClassName}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => executeCommand("insertHTML", "<p><br /></p><p><br /></p>")}
        >
          Space +
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Undo"
          title="Undo"
          className={cn(toolbarButtonClassName, toolbarIconButtonClassName)}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => executeCommand("undo")}
        >
          <Undo className="h-3.5 w-3.5" />
          <span className="sr-only">Undo</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Redo"
          title="Redo"
          className={cn(toolbarButtonClassName, toolbarIconButtonClassName)}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => executeCommand("redo")}
        >
          <Redo className="h-3.5 w-3.5" />
          <span className="sr-only">Redo</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={toolbarButtonClassName}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => executeCommand("removeFormat")}
        >
          Clear
        </Button>
      </div>

      <div className="relative px-2.5 py-2.5">
        {isEmpty && (
          <div className="pointer-events-none absolute left-5 top-5 pr-5 text-sm leading-relaxed text-muted-foreground/70">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          contentEditable
          suppressContentEditableWarning
          className={cn(
            "resume-rich-text-editor outline-none text-sm leading-relaxed text-primary",
            "[&_p]:mb-3 [&_p:last-child]:mb-0",
            "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5",
            "[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5",
            "[&_strong]:font-bold [&_em]:italic [&_u]:underline [&_u]:underline-offset-[0.18em] [&_u]:[text-decoration-thickness:1px] [&_u]:[text-decoration-skip-ink:auto]",
            minHeightClassName,
            editorClassName
          )}
          onFocus={() => {
            setIsFocused(true)
            updateToolbarState()
          }}
          onBlur={() => {
            setIsFocused(false)
            emitChange()
          }}
          onInput={emitChange}
          onKeyUp={updateToolbarState}
          onMouseUp={updateToolbarState}
          onPaste={() => {
            window.setTimeout(() => {
              emitChange()
            }, 0)
          }}
        />
      </div>
    </div>
  )
}
