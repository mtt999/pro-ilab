import { useState, useEffect } from 'react'
import { sb } from '../lib/supabase'

export const ALL_MODULES_META = [
  { key: 'supply',          label: 'Supply Inventory',       sub: 'Weekly inspection & export',      icon: '📦', bg: '#e8f2ee', color: '#2a6049', roles: ['team'] },
  { key: 'projects',        label: 'Project Inventory',      sub: 'Materials, storage & database',   icon: '🧪', bg: '#f3eeff', color: '#7c4dbd', roles: ['team', 'solo'] },
  { key: 'training',        label: 'Training Records',       sub: 'Certs, equipment & alarm',        icon: '🎓', bg: '#e0f2fe', color: '#0369a1', roles: ['team'] },
  { key: 'equipment',       label: 'Equipment Inventory',    sub: 'Lab equipment tracking',          icon: '🔧', bg: '#fef3c7', color: '#92400e', roles: ['team'] },
  { key: 'equipmenthub',    label: 'Equipment Info',         sub: 'SOPs & standards',                icon: '📚', bg: '#e8f2ee', color: '#1e4d39', roles: ['team', 'solo'] },
  { key: 'booking',         label: 'Booking Equipment',      sub: 'Reserve lab equipment',           icon: '📅', bg: '#e0f2fe', color: '#0369a1', roles: ['team', 'solo'] },
  { key: 'mileage',         label: 'Mileage Form',           sub: 'Submit mileage reimbursement',    icon: '🚗', bg: '#fdf0ed', color: '#c84b2f', roles: ['team', 'solo'] },
  { key: 'labsafety',       label: 'Lab Safety',             sub: 'Safety training & certification', icon: '🦺', bg: '#fef3c7', color: '#92400e', roles: ['team', 'solo'] },
  { key: 'remessages',      label: 'Contact Lab Manager',    sub: 'Notes, ideas & issue reports',    icon: '💬', bg: '#e8f2ee', color: '#2a6049', roles: ['team'] },
  { key: 'pm',              label: 'Project Management',     sub: 'Tasks, meetings & team chat',     icon: '📋', bg: '#fff3e0', color: '#ff6b00', roles: ['team', 'solo'] },
  { key: 'profile',         label: 'Profile',                sub: 'Your info & settings',            icon: '👤', bg: '#f3eeff', color: '#7c4dbd', roles: ['team', 'solo'] },
  { key: 'materialstorage', label: 'Material Storage',       sub: 'Store & track materials',         icon: '🗄️', bg: '#e8f2ee', color: '#1e4d39', roles: ['solo'] },
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
      <div style={{
        position: 'absolute', top: 9, right: 9,
        width: 20, height: 20, borderRadius: '50%',
        background: selected ? module.color : 'var(--surface2)',
        border: `2px solid ${selected ? module.color : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
        pointerEvents: 'none',
      }}>
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
  const roleKey = loginMode === 'solo' ? 'solo' : 'team'
  const available = ALL_MODULES_META.filter(m => m.roles.includes(roleKey))
  const studentAllowed = ['projects', 'training', 'booking', 'equipmenthub', 'mileage', 'labsafety', 'remessages', 'profile']
  const filtered = session?.role === 'student'
    ? available.filter(m => studentAllowed.includes(m.key))
    : available

  // Start with null = loading, then populate from DB
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)

  // Load saved prefs on mount so user sees their existing choices
  useEffect(() => {
    loadSaved()
  }, [])

  async function loadSaved() {
    try {
      let savedModules = null
      if (loginMode === 'solo' && session?.userId) {
        const { data } = await sb.from('solo_users')
          .select('active_modules')
          .eq('id', session.userId)
          .maybeSingle()
        savedModules = data?.active_modules
      } else if (loginMode !== 'solo' && session?.userId) {
        const { data } = await sb.from('user_dashboard_prefs')
          .select('active_modules')
          .eq('user_id', session.userId)
          .maybeSingle()
        savedModules = data?.active_modules
      } else if (!session?.userId) {
        // admin — check localStorage
        const saved = localStorage.getItem('ilab_admin_modules')
        savedModules = saved ? JSON.parse(saved) : null
      }

      if (savedModules && savedModules.length > 0) {
        // Show saved choices
        setSelected(new Set(savedModules))
      } else {
        // First time — select all by default
        setSelected(new Set(filtered.map(m => m.key)))
      }
    } catch (e) {
      setSelected(new Set(filtered.map(m => m.key)))
    }
  }

  function toggle(key) {
    if (PINNED_MODULES.includes(key)) return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function selectAll() { setSelected(new Set(filtered.map(m => m.key))) }
  function selectNone() { setSelected(new Set(PINNED_MODULES)) }

  async function save() {
    if (!selected) return
    setSaving(true)
    const modules = Array.from(selected)
    try {
      if (loginMode === 'solo' && session?.userId) {
        await sb.from('solo_users')
          .update({ active_modules: modules, has_set_dashboard: true })
          .eq('id', session.userId)
      } else if (loginMode !== 'solo' && session?.userId) {
        await sb.from('user_dashboard_prefs')
          .upsert({ user_id: session.userId, active_modules: modules, has_set_dashboard: true })
      } else {
        // admin fallback — localStorage
        localStorage.setItem('ilab_admin_modules', JSON.stringify(modules))
        localStorage.setItem('ilab_admin_dashboard_set', 'true')
      }
    } catch (e) {
      console.error('Failed to save dashboard prefs:', e)
    }
    setSaving(false)
    onDone(modules)
  }

  // Still loading saved prefs
  if (selected === null) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  )

  const selectedCount = selected.size

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}
      // Clicking the backdrop closes without saving
      onClick={e => { if (e.target === e.currentTarget) onDone(null) }}
    >
      <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '24px 28px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: loginMode === 'solo' ? '#EEEDFE' : '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>⊞</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 19, color: 'var(--text)' }}>Customize your dashboard</div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>Pick the shortcuts you want on your home screen</div>
            </div>
            {/* Close button */}
            <button
              onClick={() => onDone(null)}
              style={{ marginLeft: 'auto', border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text3)', padding: '4px 8px', borderRadius: 8, lineHeight: 1 }}
            >✕</button>
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, background: 'var(--surface2)', borderRadius: 99, margin: '18px 0 0', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, (selectedCount / filtered.length) * 100)}%`, background: loginMode === 'solo' ? '#534AB7' : '#1D9E75', borderRadius: 99, transition: 'width 0.3s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 16px' }}>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{selectedCount}</span> of {filtered.length} selected
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={selectAll} style={{ fontSize: 12, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 600, padding: '2px 0' }}>Select all</button>
              <span style={{ color: 'var(--border)' }}>·</span>
              <button onClick={selectNone} style={{ fontSize: 12, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text3)', fontWeight: 500, padding: '2px 0' }}>Clear</button>
            </div>
          </div>
        </div>

        {/* Scrollable grid */}
        <div style={{ overflowY: 'auto', padding: '0 28px', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 10, paddingBottom: 20 }}>
            {filtered.map(m => (
              <ModuleToggleCard
                key={m.key}
                module={m}
                selected={selected.has(m.key)}
                onToggle={toggle}
                pinned={PINNED_MODULES.includes(m.key)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'var(--surface)' }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>
            You can change this anytime from your <strong>Profile → Dashboard Icons</strong> tab or the <strong>🎛️ Customize</strong> button.
          </div>
          <button
            onClick={save}
            disabled={saving || selectedCount === 0}
            style={{ padding: '10px 28px', background: loginMode === 'solo' ? '#534AB7' : '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: (saving || selectedCount === 0) ? 'not-allowed' : 'pointer', opacity: (saving || selectedCount === 0) ? 0.6 : 1, transition: 'opacity 0.15s', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {saving ? 'Saving…' : 'Save & apply →'}
          </button>
        </div>
      </div>
    </div>
  )
}
