import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, FileText, HardDrive, ArrowRight, ShieldCheck, TrendingUp, Cpu, Database, Server } from 'lucide-react'
import { apiFetch } from '../../lib/api'

interface AdminUser {
  id: number
  email: string
  username: string | null
  admin: boolean
  storageLimitBytes: number
  storageUsedBytes: number
  fileCount: number
  createdAt: string
}

interface SystemInfo {
  jvmMaxMemoryMb: number
  jvmUsedMemoryMb: number
  jvmTotalMemoryMb: number
  availableProcessors: number
  diskTotalMb: number
  diskFreeMb: number
  diskUsableMb: number
  totalUsers: number
  totalFiles: number
  totalAdmins: number
  javaVersion: string
  osName: string
}

function fmt(bytes: number, d = 1): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(d)} GB`
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(d)} MB`
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(d)} KB`
  return `${bytes} B`
}
function fmtMB(bytes: number) { return `${(bytes / (1024 * 1024)).toFixed(0)} MB` }
function barColor(pct: number) { return pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#3b82f6' }

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  )
}

export default function AdminDashboard() {
  const [users, setUsers]         = useState<AdminUser[]>([])
  const [sysInfo, setSysInfo]     = useState<SystemInfo | null>(null)
  const [loading, setLoading]     = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      apiFetch('/api/admin/users').then(r => r.json()),
      apiFetch('/api/admin/system-info').then(r => r.json()),
    ]).then(([u, s]) => { setUsers(u); setSysInfo(s) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalUsers   = users.length
  const totalFiles   = users.reduce((s, u) => s + u.fileCount, 0)
  const totalUsed    = users.reduce((s, u) => s + u.storageUsedBytes, 0)
  const totalLimit   = users.reduce((s, u) => s + u.storageLimitBytes, 0)
  const platformPct  = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0
  const recent       = [...users].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)

  const stats = [
    { label: 'Total users',   value: loading ? '—' : totalUsers.toString(),        icon: Users,      accent: '#3b82f6', sub: `${users.filter(u => u.admin).length} admin` },
    { label: 'Files stored',  value: loading ? '—' : totalFiles.toString(),        icon: FileText,   accent: '#8b5cf6', sub: 'across all users' },
    { label: 'Storage used',  value: loading ? '—' : fmt(totalUsed),               icon: HardDrive,  accent: '#f59e0b', sub: `of ${fmt(totalLimit, 0)} allocated` },
    { label: 'Utilization',   value: loading ? '—' : `${platformPct.toFixed(1)}%`, icon: TrendingUp, accent: barColor(platformPct), sub: 'platform capacity' },
  ]

  const actions = [
    { label: 'Manage Users',  sub: 'Edit limits, roles, delete',  to: '/admin/users',    icon: Users },
    { label: 'App Settings',  sub: 'Registration, limits, mode',  to: '/admin/settings', icon: ShieldCheck },
  ]

  // System info bars
  const jvmPct  = sysInfo ? (sysInfo.jvmUsedMemoryMb / sysInfo.jvmMaxMemoryMb) * 100 : 0
  const diskUsedMb = sysInfo ? sysInfo.diskTotalMb - sysInfo.diskFreeMb : 0
  const diskPct = sysInfo ? (diskUsedMb / sysInfo.diskTotalMb) * 100 : 0

  return (
    <div className="p-8 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>Overview</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Platform health at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, accent, sub }) => (
          <div
            key={label}
            className="rounded-xl p-5 relative overflow-hidden"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${accent}18 0%, transparent 70%)` }} />
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>{label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}18` }}>
                <Icon size={13} style={{ color: accent }} />
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-text)', fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Platform storage bar */}
      <div className="rounded-xl p-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Platform storage</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{loading ? '…' : `${fmt(totalUsed)} used of ${fmt(totalLimit)} allocated`}</p>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded" style={{ background: `${barColor(platformPct)}18`, color: barColor(platformPct) }}>
            {platformPct.toFixed(1)}%
          </span>
        </div>
        <MiniBar pct={platformPct} color={barColor(platformPct)} />
        <div className="flex justify-between mt-2">
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>0</span>
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{fmt(totalLimit, 0)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent registrations */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
          <div className="px-5 py-3 flex items-center justify-between" style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Recent registrations</span>
            <button onClick={() => navigate('/admin/users')} className="text-xs flex items-center gap-1" style={{ color: '#f59e0b' }}>View all <ArrowRight size={11} /></button>
          </div>
          {loading ? (
            <div className="p-6 text-center text-sm" style={{ color: 'var(--color-muted)', background: 'var(--color-surface)' }}>Loading…</div>
          ) : recent.length === 0 ? (
            <div className="p-6 text-center text-sm" style={{ color: 'var(--color-muted)', background: 'var(--color-surface)' }}>No users yet.</div>
          ) : (
            <div style={{ background: 'var(--color-surface)' }}>
              {recent.map((u, i) => {
                const pct = u.storageLimitBytes > 0 ? (u.storageUsedBytes / u.storageLimitBytes) * 100 : 0
                return (
                  <div key={u.id} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: i < recent.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                      {u.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm truncate" style={{ color: 'var(--color-text)' }}>{u.email}</span>
                        {u.admin && <span className="text-xs px-1.5 py-px rounded font-medium shrink-0" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>admin</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1"><MiniBar pct={pct} color={barColor(pct)} /></div>
                        <span className="text-xs shrink-0 font-mono" style={{ color: 'var(--color-muted)' }}>{fmtMB(u.storageUsedBytes)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono" style={{ color: 'var(--color-text)' }}>{u.fileCount} files</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column: actions + system info */}
        <div className="space-y-3">
          {actions.map(({ label, sub, to, icon: Icon }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="w-full rounded-xl p-5 text-left group transition-all"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.4)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
                  <Icon size={15} style={{ color: '#f59e0b' }} />
                </div>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--color-muted)' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{sub}</p>
            </button>
          ))}

          {/* System info */}
          <div className="rounded-xl p-5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Server size={13} style={{ color: '#f59e0b' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>System</span>
            </div>
            {sysInfo ? (
              <div className="space-y-3">
                {/* JVM Memory */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-muted)' }}><Cpu size={10} /> JVM Memory</span>
                    <span className="text-xs font-mono" style={{ color: 'var(--color-text)' }}>{sysInfo.jvmUsedMemoryMb}/{sysInfo.jvmMaxMemoryMb} MB</span>
                  </div>
                  <MiniBar pct={jvmPct} color={barColor(jvmPct)} />
                </div>
                {/* Disk */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-muted)' }}><Database size={10} /> Disk</span>
                    <span className="text-xs font-mono" style={{ color: 'var(--color-text)' }}>{Math.round(diskUsedMb / 1024)}/{Math.round(sysInfo.diskTotalMb / 1024)} GB</span>
                  </div>
                  <MiniBar pct={diskPct} color={barColor(diskPct)} />
                </div>
                {/* Info rows */}
                <div className="pt-2 space-y-1.5" style={{ borderTop: '1px solid var(--color-border)' }}>
                  {[
                    ['OS', sysInfo.osName],
                    ['Java', sysInfo.javaVersion],
                    ['CPUs', sysInfo.availableProcessors.toString()],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{k}</span>
                      <span className="text-xs font-mono" style={{ color: 'var(--color-text)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Loading…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
