"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HISTORY_STACK_KEY = "acg_nav_history_stack";
const HISTORY_INDEX_KEY = "acg_nav_history_index";

type HistoryState = {
  stack: string[];
  index: number;
};

type HistoryButtonsProps = {
  fallbackHref: string;
  className?: string;
  buttonClassName?: string;
};

function clampIndex(index: number, length: number) {
  if (length <= 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}

function readHistoryState(currentPath: string): HistoryState {
  if (typeof window === "undefined") {
    return { stack: [currentPath], index: 0 };
  }

  try {
    const rawStack = sessionStorage.getItem(HISTORY_STACK_KEY);
    const rawIndex = sessionStorage.getItem(HISTORY_INDEX_KEY);
    const parsedStack = rawStack ? JSON.parse(rawStack) : [];
    const stack = Array.isArray(parsedStack) && parsedStack.every((entry) => typeof entry === "string")
      ? parsedStack
      : [];

    if (!stack.length) {
      return { stack: [currentPath], index: 0 };
    }

    const index = clampIndex(Number.parseInt(rawIndex || "", 10), stack.length);
    return { stack, index };
  } catch {
    return { stack: [currentPath], index: 0 };
  }
}

function persistHistoryState(state: HistoryState) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(HISTORY_STACK_KEY, JSON.stringify(state.stack));
  sessionStorage.setItem(HISTORY_INDEX_KEY, String(state.index));
}

function deriveHistoryState(currentPath: string): HistoryState {
  const existing = readHistoryState(currentPath);

  if (existing.stack[existing.index] === currentPath) {
    return existing;
  }

  if (existing.index > 0 && existing.stack[existing.index - 1] === currentPath) {
    return { stack: existing.stack, index: existing.index - 1 };
  }

  if (existing.index < existing.stack.length - 1 && existing.stack[existing.index + 1] === currentPath) {
    return { stack: existing.stack, index: existing.index + 1 };
  }

  const nextStack = [...existing.stack.slice(0, existing.index + 1), currentPath];
  return { stack: nextStack, index: nextStack.length - 1 };
}

export function HistoryButtons({
  fallbackHref,
  className,
  buttonClassName,
}: HistoryButtonsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const [historyState, setHistoryState] = useState<HistoryState>(() => ({
    stack: [currentPath],
    index: 0,
  }));
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const nextState = deriveHistoryState(currentPath);
    persistHistoryState(nextState);
    setHistoryState(nextState);
    setIsHydrated(true);
  }, [currentPath]);

  const canGoBack = historyState.index > 0 || currentPath !== fallbackHref;
  const canGoForward = historyState.index < historyState.stack.length - 1;

  const handleBack = () => {
    if (historyState.index > 0) {
      const nextState = {
        stack: historyState.stack,
        index: historyState.index - 1,
      };
      persistHistoryState(nextState);
      setHistoryState(nextState);
      router.push(historyState.stack[historyState.index - 1]);
      return;
    }

    if (currentPath !== fallbackHref) {
      router.push(fallbackHref);
    }
  };

  const handleForward = () => {
    if (!canGoForward) return;

    const nextState = {
      stack: historyState.stack,
      index: historyState.index + 1,
    };
    persistHistoryState(nextState);
    setHistoryState(nextState);
    router.push(historyState.stack[historyState.index + 1]);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-xl border-white/80 bg-white/85 shadow-sm backdrop-blur hover:bg-white",
          buttonClassName
        )}
        onClick={handleBack}
        disabled={isHydrated ? !canGoBack : true}
        aria-label="Go back"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-xl border-white/80 bg-white/85 shadow-sm backdrop-blur hover:bg-white",
          buttonClassName
        )}
        onClick={handleForward}
        disabled={isHydrated ? !canGoForward : true}
        aria-label="Go forward"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
