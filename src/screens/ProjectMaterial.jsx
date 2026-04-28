import HelpPanel from '../components/HelpPanel'
import { useState, useEffect } from 'react'
import { sb } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import Modal from '../components/Modal'
import TeammatesPanel from '../components/TeammatesPanel'
import ProjectMaterials from './ProjectMaterials'
import MaterialStorage from './MaterialStorage'
import ProjectDatabase from './ProjectDatabase'

// ── Helpers ────────────────────────────────────────────────────
function InfoCell({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 500 }}>{value || '—'}</div>
    </div>
  )
}

// ── Project Info (view/edit a project's metadata) ──────────────
function ProjectInfo({ project, users, onSaved, isSolo, readOnly }) {
  const { toast } = useAppStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: project.name || '', project_id: project.project_id || '',
    cfop: project.cfop || '', status: project.status || 'active',
    pi_user_id: project.pi_user_id || '', student_ids: project.student_ids || [],
    sampling_date: project.sampling_date || '', storage_date: project.storage_date || '',
    notes: project.notes || '',
  })

  useEffect(() => {
    setForm({ name: project.name || '', project_id: project.project_id || '', cfop: project.cfop || '', status: project.status || 'active', pi_user_id: project.pi_user_id || '', student_ids: project.student_ids || [], sampling_date: project.sampling_date || '', storage_date: project.storage_date || '', notes: project.notes || '' })
    setEditing(false)
  }, [project.id])

  function toggleStudent(id) {
    setForm(f => ({ ...f, student_ids: f.student_ids.includes(id) ? f.student_ids.filter(s => s !== id) : [...f.student_ids, id] }))
  }

  async function save() {
    if (!form.name.trim()) { toast('Project name is required.'); return }
    if (!form.project_id.trim()) { toast('Project title is required.'); return }
    const payload = { name: form.name.trim(), project_id: form.project_id.trim(), cfop: form.cfop.trim() || null, status: form.status, pi_user_id: form.pi_user_id || null, student_ids: form.student_ids, sampling_date: form.sampling_date || null, storage_date: form.storage_date || null, notes: form.notes.trim() || null }
    const { error } = await sb.from('projects').update(payload).eq('id', project.id)
    if (error) { toast('Error saving project.'); return }
    toast('Project info saved.'); setEditing(false); onSaved()
  }

  const piUser = users.find(u => u.id === project.pi_user_id)
  const studentUsers = users.filter(u => (project.student_ids || []).includes(u.id))
  const statusBadge = project.status === 'active' ? 'badge-active' : project.status === 'completed' ? 'badge-completed' : 'badge-hold'

  if (editing) return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>Edit project info</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm btn-primary" onClick={save}>Save</button>
          <button className="btn btn-sm" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
      <div className="grid-2">
        <div className="field"><label>Project Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
        <div className="field"><label>Project Title *</label><input value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} /></div>
      </div>
      <div className="grid-2">
        <div className="field"><label>CFOP (Funding Code)</label><input value={form.cfop} onChange={e => setForm(f => ({ ...f, cfop: e.target.value }))} /></div>
        <div className="field"><label>Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="active">Active</option><option value="on hold">On Hold</option><option value="completed">Completed</option>
          </select>
        </div>
      </div>
      {!isSolo && (
        <>
          <div className="field"><label>Principal Investigator (PI)</label>
            <select value={form.pi_user_id} onChange={e => setForm(f => ({ ...f, pi_user_id: e.target.value }))}>
              <option value="">— Select PI —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="field"><label>Students</label>
            <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
              {users.map(u => (
                <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, marginBottom: 0, background: 'var(--surface)', borderRadius: 6, padding: '6px 10px', border: form.student_ids.includes(u.id) ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
                  <input type="checkbox" checked={form.student_ids.includes(u.id)} onChange={() => toggleStudent(u.id)} style={{ width: 'auto', cursor: 'pointer' }} />
                  <span>{u.name}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
      <div className="grid-2">
        <div className="field"><label>Sampling Date</label><input type="date" value={form.sampling_date} onChange={e => setForm(f => ({ ...f, sampling_date: e.target.value }))} /></div>
        <div className="field"><label>Storage Date</label><input type="date" value={form.storage_date} onChange={e => setForm(f => ({ ...f, storage_date: e.target.value }))} /></div>
      </div>
      <div className="field"><label>Notes</label><textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} /></div>
    </div>
  )

  return (
    <div>
      {!readOnly && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button className="btn btn-sm" onClick={() => setEditing(true)}>✏️ Edit info</button>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <span className={`badge ${statusBadge}`} style={{ fontSize: 12, padding: '4px 12px' }}>{project.status}</span>
        {project.project_id && <span style={{ fontFamily: 'var(--mono)', fontSize: 12, background: 'var(--surface2)', padding: '4px 12px', borderRadius: 99, color: 'var(--text2)' }}>Title: {project.project_id}</span>}
        {project.cfop && <span style={{ fontFamily: 'var(--mono)', fontSize: 12, background: 'var(--accent-light)', padding: '4px 12px', borderRadius: 99, color: 'var(--accent)' }}>CFOP: {project.cfop}</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {!isSolo && <InfoCell label="Principal Investigator" value={piUser?.name} />}
        <InfoCell label="Created" value={new Date(project.created_at).toLocaleDateString()} />
        <InfoCell label="Sampling Date" value={project.sampling_date} />
        <InfoCell label="Storage Date" value={project.storage_date} />
      </div>
      {!isSolo && studentUsers.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Students</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {studentUsers.map(u => <span key={u.id} style={{ background: 'var(--accent3-light)', color: 'var(--accent3)', borderRadius: 99, padding: '5px 14px', fontSize: 13, fontWeight: 500 }}>👤 {u.name}</span>)}
          </div>
        </div>
      )}
      {project.notes && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Notes</div>
          <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 14, fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{project.notes}</div>
        </div>
      )}
    </div>
  )
}

// ── New Project Modal ──────────────────────────────────────────
function NewProjectModal({ users, isSolo, soloOwnerId, onClose, onCreated }) {
  const { toast } = useAppStore()
  const [form, setForm] = useState({ name: '', project_id: '', cfop: '', status: 'active', pi_user_id: '', student_ids: [], sampling_date: '', storage_date: '', notes: '' })

  function toggleStudent(id) {
    setForm(f => ({ ...f, student_ids: f.student_ids.includes(id) ? f.student_ids.filter(s => s !== id) : [...f.student_ids, id] }))
  }

  async function create() {
    if (!form.name.trim()) { toast('Project name is required.'); return }
    if (!form.project_id.trim()) { toast('Project title is required.'); return }
    const payload = { name: form.name.trim(), project_id: form.project_id.trim(), cfop: form.cfop.trim() || null, status: form.status, pi_user_id: form.pi_user_id || null, student_ids: form.student_ids, sampling_date: form.sampling_date || null, storage_date: form.storage_date || null, notes: form.notes.trim() || null, solo_owner_id: soloOwnerId || null }
    const { data, error } = await sb.from('projects').insert(payload).select().single()
    if (error) { toast('Error creating project.'); return }
    toast('Project created!'); onCreated(data.id); onClose()
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 20 }}>New project</div>
      <div className="grid-2">
        <div className="field"><label>Project Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus /></div>
        <div className="field"><label>Project Title *</label><input value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} /></div>
      </div>
      <div className="grid-2">
        <div className="field"><label>CFOP (Funding Code)</label><input value={form.cfop} onChange={e => setForm(f => ({ ...f, cfop: e.target.value }))} /></div>
        <div className="field"><label>Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="active">Active</option><option value="on hold">On Hold</option><option value="completed">Completed</option>
          </select>
        </div>
      </div>
      {!isSolo && (
        <>
          <div className="field"><label>Principal Investigator (PI)</label>
            <select value={form.pi_user_id} onChange={e => setForm(f => ({ ...f, pi_user_id: e.target.value }))}>
              <option value="">— Select PI —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="field"><label>Students</label>
            <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
              {users.map(u => (
                <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, marginBottom: 0, background: 'var(--surface)', borderRadius: 6, padding: '6px 10px', border: form.student_ids.includes(u.id) ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
                  <input type="checkbox" checked={form.student_ids.includes(u.id)} onChange={() => toggleStudent(u.id)} style={{ width: 'auto', cursor: 'pointer' }} />
                  <span>{u.name}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
      <div className="grid-2">
        <div className="field"><label>Sampling Date</label><input type="date" value={form.sampling_date} onChange={e => setForm(f => ({ ...f, sampling_date: e.target.value }))} /></div>
        <div className="field"><label>Storage Date</label><input type="date" value={form.storage_date} onChange={e => setForm(f => ({ ...f, storage_date: e.target.value }))} /></div>
      </div>
      <div className="field"><label>Notes</label><textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} /></div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className={`btn ${isSolo ? 'btn-purple' : 'btn-primary'}`} onClick={create}>Create project</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  )
}

// ── Submit Result Panel ────────────────────────────────────────
function SubmitResultPanel({ projects, session }) {
  const { toast } = useAppStore()
  const [form, setForm] = useState({ project_id: '', result_type: '', description: '', result_date: '' })
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!form.project_id) { toast('Select a project.'); return }
    if (!form.description.trim()) { toast('Description is required.'); return }
    setSaving(true)
    const { error } = await sb.from('project_results').insert({
      project_id: form.project_id,
      submitted_by: session?.name || session?.email || 'Unknown',
      result_type: form.result_type || null,
      description: form.description.trim(),
      result_date: form.result_date || null,
    })
    if (error) {
      toast('Could not save. Run the SQL migration in Supabase first.')
    } else {
      toast('Result submitted!')
      setForm({ project_id: '', result_type: '', description: '', result_date: '' })
    }
    setSaving(false)
  }

  return (
    <div>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Submit Test Result</div>
      <div className="card">
        <div className="grid-2">
          <div className="field">
            <label>Project *</label>
            <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}>
              <option value="">— Select project —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Result Type</label>
            <input value={form.result_type} onChange={e => setForm(f => ({ ...f, result_type: e.target.value }))} placeholder="e.g. Marshall Test, Density…" />
          </div>
        </div>
        <div className="field">
          <label>Description / Values *</label>
          <textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Test details, values, observations…" style={{ resize: 'vertical' }} />
        </div>
        <div className="field">
          <label>Result Date</label>
          <input type="date" value={form.result_date} onChange={e => setForm(f => ({ ...f, result_date: e.target.value }))} />
        </div>
        <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? 'Submitting…' : 'Submit Result'}</button>
      </div>
    </div>
  )
}

// ── Links Panel ────────────────────────────────────────────────
function LinksPanel({ projects, readOnly }) {
  const { toast } = useAppStore()
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ project_id: '', title: '', url: '' })
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadLinks() }, [projects.length])

  async function loadLinks() {
    setLoading(true)
    const ids = projects.map(p => p.id)
    if (!ids.length) { setLinks([]); setLoading(false); return }
    const { data } = await sb.from('project_links').select('*').in('project_id', ids).order('created_at', { ascending: false })
    setLinks(data || [])
    setLoading(false)
  }

  async function addLink() {
    if (!form.project_id) { toast('Select a project.'); return }
    if (!form.title.trim()) { toast('Title is required.'); return }
    if (!form.url.trim()) { toast('URL is required.'); return }
    setSaving(true)
    const { error } = await sb.from('project_links').insert({
      project_id: form.project_id,
      title: form.title.trim(),
      url: form.url.trim(),
    })
    if (error) {
      toast('Could not save. Run the SQL migration in Supabase first.')
    } else {
      toast('Link added!')
      setForm({ project_id: '', title: '', url: '' })
      setShowForm(false)
      loadLinks()
    }
    setSaving(false)
  }

  async function deleteLink(id) {
    if (!confirm('Delete this link?')) return
    await sb.from('project_links').delete().eq('id', id)
    toast('Link deleted.')
    loadLinks()
  }

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.name]))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>Project Links</div>
        {!readOnly && (
          <button className="btn btn-sm btn-primary" onClick={() => setShowForm(s => !s)}>
            {showForm ? 'Cancel' : '+ Add Link'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16, border: '1.5px solid var(--accent)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Add a project link</div>
          <div className="field">
            <label>Project *</label>
            <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}>
              <option value="">— Select project —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid-2">
            <div className="field"><label>Title *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Lab Report, AASHTO Reference" /></div>
            <div className="field"><label>URL *</label><input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://…" /></div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={addLink} disabled={saving}>{saving ? 'Saving…' : 'Add Link'}</button>
            <button className="btn btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : links.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🔗</div><div>No links added yet.</div></div>
      ) : (
        <div>
          {links.map(l => (
            <div key={l.id} className="card" style={{ marginBottom: 8, padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, marginBottom: 2 }}>{projectMap[l.project_id] || '—'}</div>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', textDecoration: 'none' }}>
                    🔗 {l.title}
                  </a>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.url}</div>
                </div>
                {!readOnly && (
                  <button className="btn btn-sm btn-danger" onClick={() => deleteLink(l.id)}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Project Test Results Tab ───────────────────────────────────
function ResultsTab({ projects, session }) {
  const { toast } = useAppStore()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ project_id: '', result_type: '', description: '', result_date: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadResults() }, [projects.length])

  async function loadResults() {
    setLoading(true)
    const ids = projects.map(p => p.id)
    if (!ids.length) { setResults([]); setLoading(false); return }
    const { data } = await sb.from('project_results').select('*').in('project_id', ids).order('created_at', { ascending: false })
    setResults(data || [])
    setLoading(false)
  }

  async function submitResult() {
    if (!form.project_id) { toast('Select a project.'); return }
    if (!form.description.trim()) { toast('Description is required.'); return }
    setSaving(true)
    const { error } = await sb.from('project_results').insert({
      project_id: form.project_id,
      submitted_by: session?.name || session?.email || 'Unknown',
      result_type: form.result_type || null,
      description: form.description.trim(),
      result_date: form.result_date || null,
    })
    if (error) {
      toast('Could not save. Run the SQL migration in Supabase first.')
    } else {
      toast('Result submitted!')
      setForm({ project_id: '', result_type: '', description: '', result_date: '' })
      setShowForm(false)
      loadResults()
    }
    setSaving(false)
  }

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.name]))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>Project Test Results</div>
        <button className="btn btn-sm btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Cancel' : '+ Submit Result'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20, border: '1.5px solid var(--accent)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Submit a new result</div>
          <div className="grid-2">
            <div className="field">
              <label>Project *</label>
              <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}>
                <option value="">— Select project —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Result Type</label>
              <input value={form.result_type} onChange={e => setForm(f => ({ ...f, result_type: e.target.value }))} placeholder="e.g. Marshall Test, Density…" />
            </div>
          </div>
          <div className="field">
            <label>Description / Values *</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Test details, values, observations…" style={{ resize: 'vertical' }} />
          </div>
          <div className="field">
            <label>Result Date</label>
            <input type="date" value={form.result_date} onChange={e => setForm(f => ({ ...f, result_date: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={submitResult} disabled={saving}>{saving ? 'Saving…' : 'Submit'}</button>
            <button className="btn btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : results.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">✏️</div><div>No results submitted yet.</div></div>
      ) : (
        <div>
          {results.map(r => (
            <div key={r.id} className="card" style={{ marginBottom: 10, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--accent)' }}>{projectMap[r.project_id] || 'Unknown project'}</span>
                    {r.result_type && <span style={{ fontSize: 12, background: 'var(--surface2)', borderRadius: 99, padding: '2px 8px', color: 'var(--text2)' }}>{r.result_type}</span>}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{r.description}</div>
                  {r.submitted_by && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>by {r.submitted_by}</div>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0, textAlign: 'right' }}>
                  {r.result_date && <div>{r.result_date}</div>}
                  <div>{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Workspace Tab (members / submit results / links) ───────────
function WorkspaceTab({ session, projects, isSolo, readOnly }) {
  const [wsTab, setWsTab] = useState('members')

  const wsTabs = [
    { key: 'members', label: '👥 Project Members' },
    { key: 'submit',  label: '🏆 Submit Results' },
    { key: 'links',   label: '🔗 Links' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20, overflowX: 'auto' }}>
        {wsTabs.map(t => (
          <button key={t.key} onClick={() => setWsTab(t.key)}
            style={{ padding: '10px 20px', border: 'none', background: 'transparent', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500, cursor: 'pointer', color: wsTab === t.key ? 'var(--accent)' : 'var(--text2)', borderBottom: `2px solid ${wsTab === t.key ? 'var(--accent)' : 'transparent'}`, whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {wsTab === 'members' && (
        isSolo
          ? <TeammatesPanel session={session} />
          : (
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Team Collaboration</div>
              <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>
                Team project access is managed by your lab staff. Contact your PI or staff to be added to a project team.
              </div>
            </div>
          )
      )}

      {wsTab === 'submit' && (
        <SubmitResultPanel projects={projects} session={session} />
      )}

      {wsTab === 'links' && (
        <LinksPanel projects={projects} readOnly={readOnly} />
      )}
    </div>
  )
}

// ── Material Inventory Tab ─────────────────────────────────────
function MaterialInventoryTab({ session, isSolo }) {
  const { toast, sharedWorkspaces, viewingWorkspaceOwnerId, setViewingWorkspaceOwnerId } = useAppStore()
  const [allProjects, setAllProjects] = useState([])
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [activeProject, setActiveProject] = useState(null)
  const [subTab, setSubTab] = useState('info')

  useEffect(() => { loadProjects() }, [filter, viewingWorkspaceOwnerId])
  useEffect(() => { loadUsers() }, [])
  useEffect(() => { if (activeProjectId) loadActiveProject() }, [activeProjectId])

  async function loadProjects() {
    setLoading(true)
    const baseSelect = 'id, name, project_id, status, cfop, pi_user_id, student_ids, sampling_date, notes, created_at'
    let q = sb.from('projects').select(baseSelect).order('created_at', { ascending: false })

    if (isSolo && session?.userId) {
      if (viewingWorkspaceOwnerId) {
        q = q.eq('solo_owner_id', viewingWorkspaceOwnerId)
      } else {
        q = q.or(`solo_owner_id.eq.${session.userId},solo_owner_id.is.null`)
      }
    }

    if (filter !== 'all') q = q.eq('status', filter)
    let { data, error } = await q

    if (error && isSolo) {
      let fallback = sb.from('projects').select(baseSelect).order('created_at', { ascending: false })
      if (filter !== 'all') fallback = fallback.eq('status', filter)
      const { data: fd } = await fallback
      data = fd
    }

    setAllProjects(data || [])
    setProjects(data || [])
    setLoading(false)
  }

  async function loadUsers() {
    const { data } = await sb.from('users').select('id, name').order('name')
    setUsers(data || [])
  }

  async function loadActiveProject() {
    const { data } = await sb.from('projects').select('*').eq('id', activeProjectId).single()
    setActiveProject(data || null)
  }

  async function deleteProject(id) {
    if (!confirm('Delete this project and all its data?')) return
    await sb.from('projects').delete().eq('id', id)
    setActiveProjectId(null); setActiveProject(null); loadProjects(); toast('Project deleted.')
  }

  const statusBadge = (s) => s === 'active' ? 'badge-active' : s === 'completed' ? 'badge-completed' : 'badge-hold'

  const subTabs = [
    { key: 'info',      label: '1 · Project Info' },
    { key: 'materials', label: '2 · Project Materials' },
    { key: 'storage',   label: '3 · Material Storage' },
    { key: 'database',  label: '4 · Database' },
  ]

  const viewingShared = isSolo && !!viewingWorkspaceOwnerId
  const viewingOwnerName = sharedWorkspaces.find(ws => ws.ownerId === viewingWorkspaceOwnerId)?.ownerName

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        {!viewingShared && (
          <button className={`btn btn-sm ${isSolo ? 'btn-purple' : 'btn-primary'}`} onClick={() => setShowNewModal(true)}>
            + New project
          </button>
        )}
      </div>

      {isSolo && sharedWorkspaces.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '10px 14px', background: '#EEEDFE', borderRadius: 10, border: '1px solid #CECBF6', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#534AB7', marginRight: 4, flexShrink: 0 }}>Workspace:</span>
          <button
            onClick={() => { setViewingWorkspaceOwnerId(null); setActiveProjectId(null); setActiveProject(null) }}
            style={{ padding: '4px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12, background: !viewingWorkspaceOwnerId ? '#534AB7' : 'rgba(83,74,183,0.12)', color: !viewingWorkspaceOwnerId ? '#fff' : '#534AB7', transition: 'all 0.15s' }}>
            My Workspace
          </button>
          {sharedWorkspaces.map(ws => (
            <button key={ws.ownerId}
              onClick={() => { setViewingWorkspaceOwnerId(ws.ownerId); setActiveProjectId(null); setActiveProject(null) }}
              style={{ padding: '4px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12, background: viewingWorkspaceOwnerId === ws.ownerId ? '#534AB7' : 'rgba(83,74,183,0.12)', color: viewingWorkspaceOwnerId === ws.ownerId ? '#fff' : '#534AB7', transition: 'all 0.15s' }}>
              {ws.ownerName}'s Workspace
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {['all','active','on hold','completed'].map(f => (
          <button key={f} className={'filter-btn' + (filter === f ? ' active' : '')} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ position: 'sticky', top: 72 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 24 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : projects.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}><div className="empty-icon">🧪</div><div>No projects found.</div></div>
          ) : projects.map((p, idx) => {
            const isActive = activeProjectId === p.id
            return (
              <div key={p.id} onClick={() => { setActiveProjectId(p.id); setSubTab('info') }}
                style={{ background: isActive ? 'var(--accent3-light)' : 'var(--surface)', border: `1px solid ${isActive ? 'var(--accent3)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '10px 14px', marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)', marginBottom: 1 }}>#{idx + 1}</div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: isActive ? 'var(--accent3)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    {p.project_id && <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.project_id}</div>}
                  </div>
                  <span className={`badge ${statusBadge(p.status)}`} style={{ fontSize: 10, flexShrink: 0, padding: '2px 8px' }}>{p.status}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div>
          {!activeProject ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👈</div>
              <div>Select a project from the list</div>
            </div>
          ) : (
            <div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{activeProject.name}</div>
                    <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text3)', marginTop: 2 }}>
                      {[activeProject.project_id && `Title: ${activeProject.project_id}`, activeProject.cfop && `CFOP: ${activeProject.cfop}`].filter(Boolean).join(' · ')}
                    </div>
                    {viewingShared && (
                      <div style={{ marginTop: 4, display: 'inline-block', fontSize: 11, fontWeight: 600, background: '#EEEDFE', color: '#534AB7', borderRadius: 99, padding: '2px 8px' }}>
                        {viewingOwnerName}'s workspace
                      </div>
                    )}
                  </div>
                  {!viewingShared && (
                    <button className="btn btn-sm btn-danger" onClick={() => deleteProject(activeProject.id)}>Delete</button>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 0, background: 'var(--surface)', overflowX: 'auto' }}>
                {subTabs.map(t => (
                  <button key={t.key} onClick={() => setSubTab(t.key)}
                    style={{ padding: '11px 16px', border: 'none', background: 'transparent', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: subTab === t.key ? 'var(--accent3)' : 'var(--text2)', borderBottom: `2px solid ${subTab === t.key ? 'var(--accent3)' : 'transparent'}`, whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', padding: 24 }}>
                {subTab === 'info'      && <ProjectInfo project={activeProject} users={users} onSaved={loadActiveProject} isSolo={isSolo} readOnly={viewingShared} />}
                {subTab === 'materials' && <ProjectMaterials project={activeProject} />}
                {subTab === 'storage'   && <MaterialStorage project={activeProject} />}
                {subTab === 'database'  && <ProjectDatabase project={activeProject} />}
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewModal && (
        <NewProjectModal
          users={users}
          isSolo={isSolo}
          soloOwnerId={isSolo ? session?.userId : null}
          onClose={() => setShowNewModal(false)}
          onCreated={(id) => { setActiveProjectId(id); loadProjects() }}
        />
      )}
    </div>
  )
}

// ── Main Screen ────────────────────────────────────────────────
export default function ProjectMaterial() {
  const { session, sharedWorkspaces, viewingWorkspaceOwnerId } = useAppStore()
  const isSolo = session?.loginMode === 'solo'
  const [mainTab, setMainTab] = useState('inventory')
  const [allProjects, setAllProjects] = useState([])

  const accentColor = isSolo ? '#534AB7' : 'var(--accent)'

  useEffect(() => { loadAllProjects() }, [viewingWorkspaceOwnerId])

  async function loadAllProjects() {
    const baseSelect = 'id, name, project_id, status, created_at'
    let q = sb.from('projects').select(baseSelect).order('name')

    if (isSolo && session?.userId) {
      if (viewingWorkspaceOwnerId) {
        q = q.eq('solo_owner_id', viewingWorkspaceOwnerId)
      } else {
        q = q.or(`solo_owner_id.eq.${session.userId},solo_owner_id.is.null`)
      }
    }

    let { data, error } = await q
    if (error && isSolo) {
      const { data: fd } = await sb.from('projects').select(baseSelect).order('name')
      data = fd
    }
    setAllProjects(data || [])
  }

  const viewingShared = isSolo && !!viewingWorkspaceOwnerId

  const mainTabs = [
    { key: 'inventory', label: '📦 Material Inventory' },
    { key: 'results',   label: '✏️ Project Test Results' },
    { key: 'workspace', label: '📋 Workspace' },
  ]

  return (
    <div>
      <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="section-title">Project &amp; Material</div>
        <HelpPanel screen="projects" />
      </div>

      {/* Main tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 20, overflowX: 'auto' }}>
        {mainTabs.map(t => (
          <button key={t.key} onClick={() => setMainTab(t.key)}
            style={{ padding: '12px 22px', border: 'none', background: 'transparent', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: mainTab === t.key ? accentColor : 'var(--text2)', borderBottom: `3px solid ${mainTab === t.key ? accentColor : 'transparent'}`, marginBottom: -2, whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {mainTab === 'inventory' && (
        <MaterialInventoryTab session={session} isSolo={isSolo} />
      )}

      {mainTab === 'results' && (
        <ResultsTab projects={allProjects} session={session} />
      )}

      {mainTab === 'workspace' && (
        <WorkspaceTab session={session} projects={allProjects} isSolo={isSolo} readOnly={viewingShared} />
      )}
    </div>
  )
}
