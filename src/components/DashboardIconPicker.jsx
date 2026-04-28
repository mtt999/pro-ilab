import { useState, useEffect } from 'react'
import { sb } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'

// All 12 icons available to BOTH solo and team
export const ALL_MODULES_META = [
  { key: 'supply',       screen: 'home',         label: 'Supply Inventory',    sub: 'Weekly inspection & export',      icon: '📦', bg: '#e8f2ee', color: '#2a6049', roles: ['team', 'solo'] },
  { key: 'projects',     screen: 'projects',     label: 'Project & Material',  sub: 'Inventory, results & workspace',  icon: '🧪', bg: '#f3eeff', color: '#7c4dbd', roles: ['team', 'solo'] },
  { key: 'training',     screen: 'training',     label: 'Training Records',    sub: 'Certs, equipment & alarm',        icon: '🎓', bg: '#e0f2fe', color: '#0369a1', roles: ['team', 'solo'] },
  { key: 'equipment',    screen: 'equipment',    label: 'Equipment Inventory', sub: 'Lab equipment tracking',          icon: '🔧', bg: '#fef3c7', color: '#92400e', roles: ['team', 'solo'] },
  { key: 'equipmenthub', screen: 'equipmenthub', label: 'Equipment Info',      sub: 'SOPs & standards',                icon: '📚', bg: '#e8f2ee', color: '#1e4d39', roles: ['team', 'solo'] },
  { key: 'booking',      screen: 'booking',      label: 'Booking Equipment',   sub: 'Reserve lab equipment',           icon: '📅', bg: '#e0f2fe', color: '#0369a1', roles: ['team', 'solo'] },
  { key: 'remessages',   screen: 'remessages',   label: 'Contact Lab Manager', sub: 'Notes, ideas & issue reports',    icon: '💬', bg: '#e8f2ee', color: '#2a6049', roles: ['team', 'solo'] },
  { key: 'pm',           screen: 'pm',           label: 'Project Management',  sub: 'Tasks, meetings & team chat',     icon: '📋', bg: '#fff3e0', color: '#ff6b00', roles: ['team', 'solo'] },
  { key: 'barcode',      screen: 'barcode',      label: 'Barcode Scanner',     sub: 'Scan & look up lab materials',    icon: '📷', bg: '#e0f7fa', color: '#00796b', roles: ['team', 'solo'] },
  { key: 'mileage',      screen: null,           label: 'Mileage Form',        sub: 'Submit mileage reimbursement',    icon: '🚗', bg: '#fdf0ed', color: '#c84b2f', roles: ['team', 'solo'], external: true },
  { key: 'labsafety',    screen: null,           label: 'Lab Safety',          sub: 'Safety training & certification', icon: '🦺', bg: '#fef3c7', color: '#92400e', roles: ['team', 'solo'], external: true },
  { key: 'profile',      screen: 'profile',      label: 'Profile',             sub: 'Your info & settings',            icon: '👤', bg: '#f3eeff', color: '#7c4dbd', roles: ['team', 'solo'] },
]

export const PINNED_MODULES = ['profile']

function ModuleToggleCard({ module, selected, onToggle, pinned }) {
  return (
    <div
      onClick={() => !pinned && onToggle(module.key)}
      style={{
        borderRadius: 12,
        border: selected ? `2px solid ${module.color}` : '2px solid var(--border)',
        background: selected ? `${module.color}12` : 'var(--surface)',
        padding: '14px 14px 12px',
        cursor: pinned ? 'default' : 'pointer',
        position: 'relative',
        transition: 'all 0.15s',
        opacity: pinned ? 0.7 : 1,
        userSelect: 'none',
      }}
    >
      <div style={{ position: 'absolute', top: 9, right: 9, width: 20, height: 20, borderRadius: '50%', background: selected ? module.color : 'var(--surface2)', border: `2px solid ${selected ? module.color : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', pointerEvents: 'none' }}>
        {selected && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div style={{ fontSize: 26, marginBottom: 7, pointerEvents: 'none' }}>{module.icon}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: selected ? module.color : 'var(--text)', marginBottom: 2, paddingRight: 22, pointerEvents: 'none' }}>{module.label}</div>
      <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4, pointerEvents: 'none' }}>{module.sub}</div>
      {pinned && <div style={{ marginTop: 6, fontSize: 10, color: module.color, fontWeight: 600, pointerEvents: 'none' }}>Always visible</div>}
    </div>
  )
}

export default function DashboardIconPicker({ session, loginMode, onDone }) {
  const { setActiveModules } = useAppStore()
  const available = ALL_MODULES_META

  const [selected, setSelected] = useState(null)
  const [allowedPool, setAllowedPool] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadSaved() }, [])

  async function loadSaved() {
    try {
      let savedModules = null
      let pool = null

      if (loginMode === 'solo' && session?.userId) {
        const { data } = await sb.from('solo_users').select('active_modules').eq('id', session.userId).maybeSingle()
        savedModules = data?.active_modules
      } else if (session?.userId) {
        const { data } = await sb.from('user_dashboard_prefs')
          .select('active_modules, allowed_modules')
          .eq('user_id', session.userId).maybeSingle()
        savedModules = data?.active_modules
        // Students: staff sets which icons they're allowed to pick from
        if (session?.role === 'student') {
          pool = data?.allowed_modules || []
          setAllowedPool(pool)
        }
      } else {
        // admin (no userId)
        const saved = localStorage.getItem('ilab_admin_modules')
        savedModules = saved ? JSON.parse(saved) : null
      }

      // Determine which modules to display in the picker
      const displayable = pool !== null
        ? available.filter(m => pool.includes(m.key))
        : available

      if (savedModules?.length) {
        // Restore saved, filtered to what's currently displayable
        setSelected(new Set(savedModules.filter(k => displayable.some(m => m.key === k))))
      } else {
        // First time: select all displayable by default
        setSelected(new Set(displayable.map(m => m.key)))
      }
    } catch (e) {
      setSelected(new Set(available.map(m => m.key)))
    }
  }

  function toggle(key) {
    if (PINNED_MODULES.includes(key)) return
    setSelected(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next })
  }

  function selectAll() { setSelected(new Set(displayModules.map(m => m.key))) }
  function selectNone() { setSelected(new Set(PINNED_MODULES)) }

  async function save() {
    if (!selected) return
    setSaving(true)
    const modules = Array.from(selected)
    try {
      if (loginMode === 'solo' && session?.userId) {
        await sb.from('solo_users').update({ active_modules: modules, has_set_dashboard: true }).eq('id', session.userId)
      } else if (session?.userId) {
        await sb.from('user_dashboard_prefs').upsert({ user_id: session.userId, active_modules: modules, has_set_dashboard: true })
      } else {
        localStorage.setItem('ilab_admin_modules', JSON.stringify(modules))
        localStorage.setItem('ilab_admin_dashboard_set', 'true')
      }
    } catch (e) { console.error('Failed to save dashboard prefs:', e) }
    // Always update global store immediately so dashboard reflects the change
    // without needing a page reload or re-navigation
    setActiveModules(modules)
    setSaving(false)
    onDone(modules)
  }

  if (selected === null) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  )

  // Student with no pool set yet
  if (session?.role === 'student' && allowedPool !== null && allowedPool.length === 0) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '40px 32px', maxWidth: 400, textAlign: 'center', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>No icons assigned yet</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 20 }}>Your staff hasn't assigned any dashboard icons for you yet. Contact them to get access.</div>
        <button className="btn" onClick={() => onDone(null)}>Close</button>
      </div>
    </div>
  )

  // Display: all 11 for solo/admin/staff, or staff-allowed pool for students
  const displayModules = allowedPool !== null
    ? available.filter(m => allowedPool.includes(m.key))
    : available

  const selectedCount = selected.size

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onDone(null) }}
    >
      <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
        <div style={{ padding: '24px 28px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: loginMode === 'solo' ? '#EEEDFE' : '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>⊞</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 19, color: 'var(--text)' }}>Customize your dashboard</div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
                {session?.role === 'student'
                  ? 'Pick from the icons your staff has made available for you'
                  : 'Pick the shortcuts you want on your home screen'}
              </div>
            </div>
            <button onClick={() => onDone(null)} style={{ marginLeft: 'auto', border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text3)', padding: '4px 8px', borderRadius: 8, lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ height: 3, background: 'var(--surface2)', borderRadius: 99, margin: '18px 0 0', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, (selectedCount / displayModules.length) * 100)}%`, background: loginMode === 'solo' ? '#534AB7' : '#1D9E75', borderRadius: 99, transition: 'width 0.3s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 16px' }}>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{selectedCount}</span> of {displayModules.length} selected
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={selectAll} style={{ fontSize: 12, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 600, padding: '2px 0' }}>Select all</button>
              <span style={{ color: 'var(--border)' }}>·</span>
              <button onClick={selectNone} style={{ fontSize: 12, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text3)', fontWeight: 500, padding: '2px 0' }}>Clear</button>
            </div>
          </div>
        </div>
        <div style={{ overflowY: 'auto', padding: '0 28px', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 10, paddingBottom: 20 }}>
            {displayModules.map(m => (
              <ModuleToggleCard key={m.key} module={m} selected={selected.has(m.key)} onToggle={toggle} pinned={PINNED_MODULES.includes(m.key)} />
            ))}
          </div>
        </div>
        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'var(--surface)' }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>
            You can change this anytime from <strong>Profile → Dashboard Icons</strong>.
          </div>
          <button onClick={save} disabled={saving || selectedCount === 0}
            style={{ padding: '10px 28px', background: loginMode === 'solo' ? '#534AB7' : '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: (saving || selectedCount === 0) ? 'not-allowed' : 'pointer', opacity: (saving || selectedCount === 0) ? 0.6 : 1, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {saving ? 'Saving…' : 'Save & apply →'}
          </button>
        </div>
      </div>
    </div>
  )
}
