'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { CheckIcon, MinusIcon } from 'lucide-react'

import { cn } from '@/shared/utils/cn'

function Checkbox({
  className,
  checked,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  const [indeterminate, setIndeterminate] = React.useState(false)
  const checkboxRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (checkboxRef.current) {
      // @ts-ignore - Radix UI checkbox doesn't expose indeterminate directly, but we can set it on the underlying element
      checkboxRef.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  // Determine if indeterminate based on checked prop
  React.useEffect(() => {
    if (checked === 'indeterminate') {
      setIndeterminate(true)
    } else {
      setIndeterminate(false)
    }
  }, [checked])

  return (
    <CheckboxPrimitive.Root
      ref={checkboxRef}
      data-slot="checkbox"
      checked={checked === 'indeterminate' ? false : checked}
      className={cn(
        'peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        indeterminate && 'bg-primary border-primary text-primary-foreground',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        {indeterminate ? (
          <MinusIcon className="size-3.5" />
        ) : (
        <CheckIcon className="size-3.5" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
