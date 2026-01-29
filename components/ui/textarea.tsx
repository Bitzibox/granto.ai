import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'text-foreground border-input placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-24 w-full rounded-lg border bg-transparent px-3 py-2 text-base shadow-sm transition-all duration-300 outline-none focus-visible:ring-[3px] focus-visible:shadow-md disabled:cursor-not-allowed disabled:opacity-50 md:text-sm hover:border-primary/40',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
