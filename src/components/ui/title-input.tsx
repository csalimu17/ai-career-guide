"use client"

import { forwardRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { toTitleCase } from "@/lib/title-case"

type InputProps = React.ComponentPropsWithoutRef<typeof Input>

export const TitleInput = forwardRef<HTMLInputElement, InputProps>(
  ({ onChange, onBlur, ...props }, ref) => {
    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        const corrected = toTitleCase(e.target.value)
        if (corrected !== e.target.value && onChange) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          )?.set
          nativeInputValueSetter?.call(e.target, corrected)
          e.target.dispatchEvent(new Event('input', { bubbles: true }))
          onChange({ ...e, target: { ...e.target, value: corrected } } as React.ChangeEvent<HTMLInputElement>)
        }
        onBlur?.(e)
      },
      [onChange, onBlur]
    )

    return <Input ref={ref} onChange={onChange} onBlur={handleBlur} {...props} />
  }
)

TitleInput.displayName = "TitleInput"
