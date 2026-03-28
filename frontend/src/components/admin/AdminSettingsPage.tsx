import { useEffect, useState } from 'react'
import { UserPlus, Upload, HardDrive, AlertTriangle, Save, Loader2, Trash2 } from 'lucide-react'
import { apiFetch } from '../../lib/api'
import { useToastStore } from '../../store/useToastStore'

interface AppSettings {
  allowRegistration: boolean
  maxUploadSizeMb: number
  defaultStorageLimitMb: number
  maintenanceMode: boolean
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors"
      style={{ background: value ? '#f59e0b' : 'var(--color-border)' }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full shadow transition-transform mt-0.5"
        style={{ background: '#fff', transform: value ? 'translateX(1.125rem)' : 'translateX(0.125rem)' }}
      />
    </button>
  )
}

function SettingRow({ icon: Icon, title, description, children, danger }: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  title: string
  description: string
  children: React.ReactNode
  danger?: boolean
}) {
  const accent = danger ? '#ef4444' : '#f59e0b'
  return (
    <div
      className="flex items-start justify-between gap-4 px-6 py-5"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      <div className="flex items-start gap-3 flex-1">
        <div
          className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5"
          style={{ background: `${accent}18` }}
        >
          <Icon size={14} style={{ color: accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{title}</p>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--color-muted)' }}>{description}</p>
        </div>
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  )
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [draft, setDraft]       = useState<AppSettings | null>(null)
  const [saving, setSaving]     = useState(false)
  const [loading, setLoading]   = useState(true)
  const addToast = useToastStore(s => s.addToast)

  useEffect(() => {
    apiFetch('/api/admin/settings')
      .then(r => r.json())
      .then((data: AppSettings) => { setSettings(data); setDraft(data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    if (!draft) return
    setSaving(true)
    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      if (res.ok) {
        const updated = await res.json()
        setSettings(updated); setDraft(updated)
        addToast('success', 'Settings saved')
      } else addToast('error', 'Failed to save')
    } finally { setSaving(false) }
  }

  const isDirty = draft && settings && JSON.stringify(draft) !== JSON.stringify(settings)

  if (loading || !draft) {
    return (
      <div className="p-8 flex items-center gap-2 text-sm" style={{ color: 'var(--color-muted)' }}>
        <Loader2 size={14} className="animate-spin" /> Loading settings…
      </div>
    )
  }

  const numInput = (value: number, onChange: (v: number) => void, min = 1, max = 999999) => (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Math.max(min, parseInt(e.target.value) || min))}
        className="w-24 text-sm text-right rounded-lg px-3 py-1.5 font-mono"
        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', outline: 'none' }}
      />
      <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>MB</span>
    </div>
  )

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>App Settings</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Global configuration for Crystal PDF.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
          style={{
            background: isDirty ? '#f59e0b' : 'var(--color-surface-2)',
            color: isDirty ? '#000' : 'var(--color-muted)',
            border: `1px solid ${isDirty ? '#f59e0b' : 'var(--color-border)'}`,
          }}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Save changes
        </button>
      </div>

      {/* Settings card */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="px-6 py-3" style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>General</span>
        </div>

        <SettingRow icon={UserPlus} title="Allow registration" description="New users can create accounts. Disable to restrict signups.">
          <Toggle value={draft.allowRegistration} onChange={v => setDraft({ ...draft, allowRegistration: v })} />
        </SettingRow>

        <SettingRow icon={Upload} title="Max upload size" description="Maximum file size per upload.">
          {numInput(draft.maxUploadSizeMb, v => setDraft({ ...draft, maxUploadSizeMb: v }))}
        </SettingRow>

        <SettingRow icon={HardDrive} title="Default storage limit" description="Storage quota for new users on registration.">
          {numInput(draft.defaultStorageLimitMb, v => setDraft({ ...draft, defaultStorageLimitMb: v }))}
        </SettingRow>

        <SettingRow icon={AlertTriangle} title="Maintenance mode" description="Blocks all non-admin access. Use during updates or migrations.">
          <Toggle value={draft.maintenanceMode} onChange={v => setDraft({ ...draft, maintenanceMode: v })} />
        </SettingRow>
      </div>

      {/* Maintenance warning */}
      {draft.maintenanceMode && (
        <div
          className="mt-4 flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
        >
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          Maintenance mode is active — regular users cannot access the app.
        </div>
      )}

      {/* Danger zone */}
      <div className="mt-6 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
        <div className="px-6 py-3" style={{ background: 'rgba(239,68,68,0.06)', borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#ef4444' }}>Danger zone</span>
        </div>
        <SettingRow
          icon={Trash2}
          title="Flush application cache"
          description="Clear server-side caches. No data is lost."
          danger
        >
          <button
            onClick={() => addToast('success', 'Cache flushed')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            Flush cache
          </button>
        </SettingRow>
      </div>
    </div>
  )
}
