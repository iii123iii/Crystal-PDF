import { useState } from 'react'
import { Loader2, Copy } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { useToastStore } from '../../../store/useToastStore'

type PageCrop = { top: number; right: number; bottom: number; left: number }

interface Props {
  docId: string
  pdfPassword: string | null
  currentPage: number
  totalPages: number
  pageCrops: Map<number, PageCrop>
  getPageCrop: (page: number) => PageCrop
  onPageCropChange: (page: number, crop: PageCrop) => void
  onApplyAll: (crop: PageCrop) => void
  onSuccess: (doc: { id: number; originalName: string }) => void
}

export default function CropPanel({
  docId, pdfPassword,
  currentPage, totalPages,
  pageCrops, getPageCrop, onPageCropChange, onApplyAll,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false)
  const addToast = useToastStore(s => s.addToast)

  const crop = getPageCrop(currentPage)
  const customizedCount = pageCrops.size

  async function handleApply() {
    setLoading(true)
    try {
      // Build per-page entries for all configured pages
      // Pages without explicit settings use the defaults (no crop needed = skip them)
      const pageCropEntries = Array.from(pageCrops.entries()).map(([page, c]) => ({
        page,
        marginTop: c.top,
        marginRight: c.right,
        marginBottom: c.bottom,
        marginLeft: c.left,
      }))

      if (pageCropEntries.length === 0) {
        addToast('error', 'No crop settings configured. Drag the handles on any page first.')
        return
      }

      const res = await apiFetch(`/api/documents/${docId}/tools/crop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePassword: pdfPassword, pageCrops: pageCropEntries }),
      })
      if (res.ok) onSuccess(await res.json())
      else addToast('error', 'Failed to crop')
    } catch { addToast('error', 'Failed to crop pages.') }
    finally { setLoading(false) }
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
    outline: 'none',
  }

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
        Drag the blue handles on each page to set its crop, or enter values manually (points, 72pt = 1 inch).
      </p>

      {/* Current page indicator */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
          Page {currentPage} of {totalPages}
        </span>
        {customizedCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>
            {customizedCount} page{customizedCount !== 1 ? 's' : ''} configured
          </span>
        )}
      </div>

      {/* Per-page margin inputs */}
      <div className="grid grid-cols-2 gap-3">
        {([
          { label: 'Top',    key: 'top'    },
          { label: 'Right',  key: 'right'  },
          { label: 'Bottom', key: 'bottom' },
          { label: 'Left',   key: 'left'   },
        ] as { label: string; key: keyof PageCrop }[]).map(({ label, key }) => (
          <div key={key}>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>{label} (pt)</label>
            <input
              type="number"
              value={crop[key]}
              onChange={e => onPageCropChange(currentPage, { ...crop, [key]: Math.max(0, Math.min(300, +e.target.value)) })}
              min={0}
              max={300}
              className="w-full text-sm px-3 py-2 rounded-lg"
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      {/* Apply current page settings to all pages */}
      <button
        onClick={() => onApplyAll(crop)}
        className="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        style={{ background: 'var(--color-surface-2)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
      >
        <Copy size={12} />
        Apply page {currentPage} settings to all pages
      </button>

      <button
        onClick={handleApply}
        disabled={loading || customizedCount === 0}
        className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-40"
        style={{ background: 'var(--color-accent)', color: '#fff' }}
      >
        {loading
          ? <Loader2 size={14} className="animate-spin mx-auto" />
          : customizedCount > 0
            ? `Crop ${customizedCount} page${customizedCount !== 1 ? 's' : ''}`
            : 'Crop Pages'}
      </button>
    </div>
  )
}
