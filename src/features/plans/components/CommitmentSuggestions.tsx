import { ChevronRight, Lightbulb } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
// Deep-imported from the feature's `types` barrel rather than its root on
// purpose: `features/suggested-actions` imports `features/plans` for the
// aspect catalogue, so going through the barrel would close an import cycle.
import type { SuggestedAction } from '@/features/suggested-actions/types'

interface CommitmentSuggestionsProps {
  /** The department's defaults, already narrowed to this commitment's aspect. */
  departmentActions: SuggestedAction[]
  /**
   * Hands back the wording that was picked. The caller decides how to merge it
   * — `appendSuggestedAction` adds it to what is already written rather than
   * replacing it, which is what this used to do.
   */
  onPick: (action: string) => void
  disabled?: boolean
}

/**
 * The wordings a director can drop into a commitment with one click: the ones
 * their own department set as defaults in `/acciones`, for the aspect this
 * commitment belongs to.
 *
 * Collapsed by default: a director filling several commitments in a row is
 * writing, not shopping, and an open list of wordings under every card buries
 * the fields themselves.
 *
 * @example
 * <CommitmentSuggestions departmentActions={forThisAspect}
 *   onPick={(action) => patch({ commitment: appendSuggestedAction(item.commitment, action) })} />
 */
export function CommitmentSuggestions({
  departmentActions,
  onPick,
  disabled = false,
}: CommitmentSuggestionsProps) {
  if (departmentActions.length === 0) return null

  return (
    <Collapsible className="text-muted-foreground text-xs">
      <CollapsibleTrigger className="group flex cursor-pointer items-center gap-1.5">
        <ChevronRight
          aria-hidden="true"
          className="size-3.5 shrink-0 transition-transform group-data-panel-open:rotate-90"
        />
        <Lightbulb className="size-3.5" aria-hidden="true" />
        Acciones sugeridas (<span className="num">{departmentActions.length}</span>)
      </CollapsibleTrigger>

      <CollapsibleContent>
        <ul className="mt-1.5 space-y-1 pl-5">
          {departmentActions.map((action) => (
            <li key={action.id} className="list-disc">
              <Button
                type="button"
                variant="link"
                size="sm"
                disabled={disabled}
                className="h-auto justify-start px-0 py-0 text-left text-xs font-normal whitespace-normal"
                onClick={() => onPick(action.action)}
              >
                {action.action}
              </Button>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}
