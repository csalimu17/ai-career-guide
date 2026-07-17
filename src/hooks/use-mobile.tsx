import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Returns `true` on mobile, `false` on desktop, and `undefined` while the
 * value has not yet been resolved on the client (i.e. SSR or first render
 * before useEffect runs).
 *
 * Returning `undefined` (rather than coercing to `false`) lets callers
 * delay rendering layout-dependent UI until they actually know the
 * viewport size. This prevents the desktop layout from hydrating on a
 * phone and then visibly swapping to the mobile layout.
 *
 * Most consumers can continue using the value as a boolean in
 * conditionals (`undefined` is falsy). Consumers that render entirely
 * different trees per viewport (cv-editor, mobile vs desktop shells)
 * should gate on `isMobile === undefined` and show a loader.
 */
export function useIsMobile(): boolean | undefined {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
