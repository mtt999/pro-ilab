import { useEffect, useState } from 'react'
import { useAppStore } from './store/useAppStore'
import { sb } from './lib/supabase'
import Login from './screens/Login'
import AdminLogin from './screens/AdminLogin'
import Layout from './components/Layout'
import Dashboard from './screens/Dashboard'
import REMessages from './screens/REMessages'
import Home from './screens/Home'
import Inspection from './screens/Inspection'
import Results from './screens/Results'
import Projects from './screens/Projects'
import ProjectMaterial from './screens/ProjectMaterial'
import ProjectDetail from './screens/ProjectDetail'
import History from './screens/History'
import TrainingRecords from './screens/TrainingRecords'
import Profile from './screens/Profile'
import EquipmentInventory from './screens/EquipmentInventory'
import EquipmentHub from './screens/EquipmentHub'
import BookingEquipment from './screens/BookingEquipment'
import PM from './screens/PM'
import Toast from './components/Toast'
import DashboardIconPicker from './components/DashboardIconPicker'

// Detect if we're on the /admin route
const IS_ADMIN_ROUTE = window.location.pathname.endsWith('/admin') || window.location.pathname.endsWith('/admin/')

export default function App() {
  const { session, screen, refreshCache, setScreen, setActiveModules } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [userAccess, setUserAccess] = useState(null)
  const [showIconPicker, setShowIconPicker] = useState(null)

  useEffect(() => {
    const loginMode = localStorage.getItem('ilab_login_mode')
    if (loginMode === 'solo') {
      setLoading(false)
    } else {
      refreshCache().finally(() => setLoading(false))
    }
  }, [])

  useEffect(() => {
    if (session?.loginMode) {
      localStorage.setItem('ilab_login_mode', session.loginMode)
    } else if (!session) {
      localStorage.removeItem('ilab_login_mode')
      setShowIconPicker(null)
      setActiveModules(null)
    }
  }, [session])

  useEffect(() => {
    if (!session?.loginMode) return
    checkFirstLogin(session.userId, session.loginMode)
  }, [session?.loginMode, session?.userId])

  async function checkFirstLogin(userId, loginMode) {
    try {
      if (!userId) {
        const done = localStorage.getItem('ilab_admin_dashboard_set') === 'true'
        setShowIconPicker(!done)
        return
      }
      if (loginMode === 'solo') {
        const { data } = await sb.from('solo_users').select('has_set_dashboard').eq('id', userId).maybeSingle()
        setShowIconPicker(data?.has_set_dashboard !== true)
      } else {
        const { data } = await sb.from('user_dashboard_prefs').select('has_set_dashboard').eq('user_id', userId).maybeSingle()
        setShowIconPicker(data?.has_set_dashboard !== true)
      }
    } catch (e) {
      setShowIconPicker(false)
    }
  }

  useEffect(() => {
    if (session?.userId && (session?.role === 'user' || session?.role === 'admin')) {
      sb.from('user_screen_access').select('screen_key').eq('user_id', session.userId)
        .then(({ data }) => {
          if (data?.length) setUserAccess(new Set(data.map(r => r.screen_key)))
          else setUserAccess(null)
        })
        .catch(() => setUserAccess(null))
    } else {
      setUserAccess(null)
    }
  }, [session?.userId])

  useEffect(() => {
    if (session?.role === 'student') {
      const allowed = ['dashboard', 'projects', 'project-detail', 'training', 'profile', 'equipmenthub', 'booking', 'remessages']
      if (!allowed.includes(screen)) setScreen('dashboard')
    }
    const INTERNAL = new Set(['dashboard', 'profile', 'inspection', 'results', 'project-detail'])
    if ((session?.role === 'user' || session?.role === 'admin') && userAccess && !INTERNAL.has(screen)) {
      if (!userAccess.has(screen)) setScreen('dashboard')
    }
  }, [session, screen, userAccess])

  if (loading) return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 999 }}>
      <div className="spinner" />
      <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text3)' }}>Connecting to database…</div>
    </div>
  )

  // Admin-only route: /pro-ilab/admin
  if (IS_ADMIN_ROUTE) {
    if (!session || session.role !== 'admin') return <AdminLogin />
  }

  if (!session) return <Login />

  const screens = {
    dashboard: <Dashboard />,
    home: <Home />,
    inspection: <Inspection />,
    results: <Results />,
    projects: <ProjectMaterial />,
    'project-detail': <ProjectDetail />,
    history: <History />,
    training: <TrainingRecords />,
    profile: <Profile />,
    equipment: <EquipmentInventory />,
    equipmenthub: <EquipmentHub />,
    booking: <BookingEquipment />,
    remessages: <REMessages />,
    pm: <PM />,
  }

  return (
    <>
      <Layout>{screens[screen] || <Dashboard />}</Layout>
      <Toast />
      {showIconPicker === true && (
        <DashboardIconPicker
          session={session}
          loginMode={session.loginMode}
          onDone={(modules) => {
            if (!session.userId) localStorage.setItem('ilab_admin_dashboard_set', 'true')
            if (modules) setActiveModules(modules)
            setShowIconPicker(false)
          }}
        />
      )}
    </>
  )
}
