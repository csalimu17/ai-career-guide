"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Bold, Italic, List, ListOrdered, Pilcrow, Redo, Underline, Undo, SpellCheck2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { isRichTextEmpty, normalizeRichTextValue, richTextToPlainText, sanitizeRichTextHtml } from "@/lib/rich-text"
import { checkGrammar, type GrammarIssue } from "@/lib/grammar-check"
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
  const [grammarIssues, setGrammarIssues] = useState<GrammarIssue[]>([])
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false)
  const lastCheckedTextRef = useRef<string>("")

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

  const runGrammarCheck = useCallback(async () => {
    if (!editorRef.current) return
    const plain = richTextToPlainText(editorRef.current.innerHTML)
    if (!plain || plain === lastCheckedTextRef.current) return
    lastCheckedTextRef.current = plain
    setIsCheckingGrammar(true)
    const issues = await checkGrammar(plain)
    setGrammarIssues(issues)
    setIsCheckingGrammar(false)
  }, [])

  const applyFix = useCallback((issue: GrammarIssue, issueIdx: number) => {
    if (!editorRef.current) return
    const html = editorRef.current.innerHTML
    editorRef.current.innerHTML = html.replace(issue.bad, issue.suggestions[0])
    emitChange()
    setGrammarIssues(prev => prev.filter((_, i) => i !== issueIdx))
  }, [emitChange])

  const dismissIssue = useCallback((issueIdx: number) => {
    setGrammarIssues(prev => prev.filter((_, i) => i !== issueIdx))
  }, [])

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

  const insertText = useCallback(
    (text: string) => {
      if (!editorRef.current) return
      editorRef.current.focus()
      try {
        document.execCommand("insertText", false, text)
      } catch {
        editorRef.current.innerHTML += text
      }
      emitChange()
    },
    [emitChange]
  )

  const toolbarButtonClassName =
    "h-7 shrink-0 rounded-lg border border-border/70 bg-white px-2 text-[8px] font-semibold uppercase tracking-[0.12em] text-muted-foreground shadow-sm hover:bg-muted/40 hover:text-primary sm:h-9 sm:px-3 sm:text-[11px]"
  const toolbarIconButtonClassName = "w-7 px-0 sm:w-9 sm:px-0"

  const toolbarToggleClassName = (active: boolean) =>
    cn(toolbarButtonClassName, active && "border-primary/30 bg-primary/10 text-primary")

  return (
    <div className={cn("max-w-full overflow-hidden rounded-[1.35rem] border border-border/70 bg-white shadow-sm", className)}>
      <div className="no-scrollbar sticky top-0 z-10 flex items-center gap-1 overflow-x-auto border-b border-border/70 bg-white/95 px-2 py-2 backdrop-blur md:flex-wrap md:overflow-visible md:px-3 md:py-3">
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

        <div className="flex items-center gap-1 border-l border-slate-200 pl-2 ml-1 hidden sm:flex">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mr-1">Action Verbs:</span>
          {["Spearheaded", "Optimized", "Architected", "Scaled"].map((verb) => (
            <button
              key={verb}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertText(` ${verb} `)}
              className="text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-md px-1.5 py-0.5 transition-colors cursor-pointer"
            >
              {verb}
            </button>
          ))}
        </div>
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
          Break
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
          Reset
        </Button>

        {/* Grammar check trigger */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Check grammar"
          title="Check spelling & grammar"
          disabled={isCheckingGrammar}
          className={cn(
            toolbarButtonClassName, toolbarIconButtonClassName,
            grammarIssues.length > 0 && "border-amber-300 bg-amber-50 text-amber-600"
          )}
          onMouseDown={(event) => event.preventDefault()}
          onClick={runGrammarCheck}
        >
          {isCheckingGrammar ? (
            <div className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : (
            <SpellCheck2 className="h-3.5 w-3.5" />
          )}
          <span className="sr-only">Check Grammar</span>
        </Button>
      </div>

      <div className="relative px-2.5 py-2.5 sm:px-3 sm:py-3">
        {isEmpty && (
          <div className="pointer-events-none absolute left-5 top-5 pr-5 text-[13px] leading-relaxed text-muted-foreground/70 sm:text-sm">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          contentEditable
          suppressContentEditableWarning
          spellCheck
          className={cn(
            "resume-rich-text-editor outline-none text-[13px] leading-relaxed text-primary sm:text-sm break-words",
            "[&_p]:mb-3 [&_p:last-child]:mb-0 w-full max-w-full",
            "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:break-words",
            "[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_ol]:break-words",
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
            // Delay to let emitChange fire first, then run grammar check in background
            setTimeout(runGrammarCheck, 400)
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

      {/* Grammar & spelling suggestions panel */}
      {grammarIssues.length > 0 && (
        <div className="border-t border-amber-100 bg-amber-50/60 px-3 py-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-700">
              <SpellCheck2 className="h-3 w-3" />
              {grammarIssues.length} suggestion{grammarIssues.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => setGrammarIssues([])}
              className="text-[10px] font-bold text-amber-500 hover:text-amber-700 transition-colors"
            >
              Dismiss all
            </button>
          </div>
          <div className="space-y-1.5">
            {grammarIssues.map((issue, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-lg bg-white/70 px-2.5 py-1.5 text-[11px]">
                <div className="min-w-0 flex-1 leading-snug">
                  <span className="font-semibold text-red-500 line-through">{issue.bad}</span>
                  <span className="mx-1 text-slate-400">→</span>
                  <span className="font-semibold text-emerald-700">{issue.suggestions[0]}</span>
                  <span className="ml-1.5 text-[10px] text-slate-400">{issue.message}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => applyFix(issue, i)}
                    className="rounded-md px-2 py-0.5 text-[10px] font-bold text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => dismissIssue(i)}
                    className="flex h-4 w-4 items-center justify-center rounded text-slate-400 transition-colors hover:text-slate-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isCheckingGrammar && (
        <div className="border-t border-slate-100 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full border-2 border-slate-300 border-t-slate-500 animate-spin" />
          Checking spelling & grammar…
        </div>
      )}
    </div>
  )
}
