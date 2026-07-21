import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { CSSProperties } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'

type SyntaxStyle = Record<string, CSSProperties>

interface LogDetailDialogProps {
  selectedDetail: string | null
  syntaxStyle: SyntaxStyle
  onClose: () => void
}

/**
 * LogDetailDialog component displays the detailed view of a log entry in a dialog.
 *
 * @param selectedDetail - The detail of the selected log entry to display.
 * @param syntaxStyle - The syntax highlighting style to use for displaying the log detail.
 * @param onClose - Callback function to handle closing the dialog.
 */
export function LogDetailDialog({ selectedDetail, syntaxStyle, onClose }: LogDetailDialogProps) {
  return (
    <Dialog
      open={selectedDetail !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalle (body)</DialogTitle>
        </DialogHeader>

        <div className="min-w-0 flex-1">
          {selectedDetail && (
            <SyntaxHighlighter
              language="json"
              style={syntaxStyle}
              customStyle={{
                margin: 0,
                padding: '4px 8px',
                fontSize: 'inherit',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'break-word',
                lineHeight: '1.5',
              }}
            >
              {selectedDetail}
            </SyntaxHighlighter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
