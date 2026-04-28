import { useState, useEffect, useRef } from 'react'
import { sb } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'

export default function BarcodeScannerScreen() {
  const { setScreen } = useAppStore()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const detectorRef = useRef(null)
  const streamRef = useRef(null)

  const [cameraError, setCameraError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [result, setResult] = useState(null)
  const [looking, setLooking] = useState(false)
  const [detectorSupported, setDetectorSupported] = useState(true)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  async function startCamera() {
    setCameraError('')
    try {
      // Try environment camera first, fall back to any camera (for Mac)
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
      }
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
          initDetector()
        }
      }
    } catch (e) {
      setCameraError('Camera not available on this device. Use the manual entry below.')
    }
  }

  function stopCamera() {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
  }

  function initDetector() {
    if (!('BarcodeDetector' in window)) {
      setDetectorSupported(false)
      return
    }
    try {
      detectorRef.current = new window.BarcodeDetector({
        formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'data_matrix'],
      })
      setScanning(true)
      detectLoop()
    } catch {
      setDetectorSupported(false)
    }
  }

  function detectLoop() {
    const video = videoRef.current
    if (!video || video.readyState < 2) {
      animRef.current = requestAnimationFrame(detectLoop)
      return
    }
    detectorRef.current.detect(video).then(codes => {
      if (codes.length > 0) {
        const value = codes[0].rawValue
        if (value) {
          setScanning(false)
          if (animRef.current) cancelAnimationFrame(animRef.current)
          lookupBarcode(value)
          return
        }
      }
      animRef.current = requestAnimationFrame(detectLoop)
    }).catch(() => {
      animRef.current = requestAnimationFrame(detectLoop)
    })
  }

  async function lookupBarcode(value) {
    setLooking(true)
    setResult(null)
    try {
      const { data } = await sb
        .from('project_materials')
        .select('*, projects(name, project_id)')
        .eq('barcode_id', value.trim().toUpperCase())
        .maybeSingle()
      if (data) {
        setResult({ found: true, material: data, scannedValue: value })
      } else {
        setResult({ found: false, scannedValue: value })
      }
    } catch {
      setResult({ found: false, scannedValue: value, error: true })
    }
    setLooking(false)
  }

  function reset() {
    setResult(null)
    setManualInput('')
    setScanning(true)
    detectLoop()
  }

  const typeLabel = t => ({ aggregate: 'Aggregate', asphalt_binder: 'Asphalt Binder', plant_mix: 'Plant Mix', cores: 'Cores', other: 'Other' }[t] || t || '—')

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="section-title">📷 Barcode Scanner</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>Scan a material label to look up its details</div>
        </div>
      </div>

      {/* Camera view */}
      {!result && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
          {cameraError ? (
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📷</div>
              <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{cameraError}</div>
            </div>
          ) : (
            <div style={{ position: 'relative', background: '#000', minHeight: 240 }}>
              <video ref={videoRef} autoPlay playsInline muted
                style={{ width: '100%', display: 'block', maxHeight: 280, objectFit: 'cover' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              {/* Scanner overlay */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ width: 200, height: 200, position: 'relative' }}>
                  {/* Corner brackets */}
                  {[['top:0,left:0','borderTop','borderLeft'],['top:0,right:0','borderTop','borderRight'],
                    ['bottom:0,left:0','borderBottom','borderLeft'],['bottom:0,right:0','borderBottom','borderRight']].map(([pos], i) => {
                    const p = Object.fromEntries(pos.split(',').map(s => s.split(':')))
                    return (
                      <div key={i} style={{ position: 'absolute', width: 28, height: 28, borderColor: '#00e5b0', borderStyle: 'solid', borderWidth: 0, ...p,
                        ...(pos.includes('top:0') ? { borderTopWidth: 3 } : { borderBottomWidth: 3 }),
                        ...(pos.includes('left:0') ? { borderLeftWidth: 3 } : { borderRightWidth: 3 }),
                        borderRadius: pos.includes('top:0,left:0') ? '6px 0 0 0' : pos.includes('top:0,right:0') ? '0 6px 0 0' : pos.includes('bottom:0,left:0') ? '0 0 0 6px' : '0 0 6px 0'
                      }} />
                    )
                  })}
                  {/* Scan line animation */}
                  {scanning && (
                    <div style={{ position: 'absolute', left: 4, right: 4, height: 2, background: 'rgba(0,229,176,0.8)', borderRadius: 1, animation: 'scanline 1.8s ease-in-out infinite' }} />
                  )}
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center' }}>
                {scanning && detectorSupported && (
                  <span style={{ background: 'rgba(0,0,0,0.55)', color: '#00e5b0', fontSize: 12, padding: '4px 14px', borderRadius: 99, fontWeight: 500 }}>
                    Scanning…
                  </span>
                )}
                {!detectorSupported && !cameraError && (
                  <span style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 12, padding: '4px 14px', borderRadius: 99 }}>
                    Auto-scan not supported — use manual entry below
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lookup result */}
      {looking && (
        <div className="card" style={{ textAlign: 'center', padding: '32px 24px', marginBottom: 20 }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 14, color: 'var(--text2)' }}>Looking up barcode…</div>
        </div>
      )}

      {result && !looking && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ fontSize: 28 }}>{result.found ? '✅' : '❌'}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                {result.found ? 'Material found' : 'Not found'}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
                {result.scannedValue}
              </div>
            </div>
          </div>

          {result.found && (
            <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['Material', result.material.name || typeLabel(result.material.material_type)],
                  ['Type', typeLabel(result.material.material_type)],
                  ['Project', result.material.projects?.name || '—'],
                  ['Project ID', result.material.projects?.project_id || '—'],
                  ['Storage', result.material.storage_confirmed ? '✅ Confirmed' : '⏳ Pending'],
                  ['Sampled', result.material.sampling_date || '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>
              {result.material.storage_notes && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--surface)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--accent)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Storage notes</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{result.material.storage_notes}</div>
                </div>
              )}
              {(result.material.locations || []).length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.material.locations.map((loc, i) => (
                    <span key={i} style={{ background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 99, padding: '3px 12px', fontSize: 12, fontWeight: 500 }}>
                      📍 {loc.detail || loc.location_id || loc.location}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {!result.found && (
            <div style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>
              No material with barcode <strong>{result.scannedValue}</strong> was found in the database.
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={reset}>📷 Scan another</button>
            <button className="btn" onClick={() => setScreen('projects')}>Go to Projects →</button>
          </div>
        </div>
      )}

      {/* Manual entry */}
      {!result && (
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Manual entry</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>
            {detectorSupported && !cameraError ? 'Or type a barcode ID directly:' : 'Enter the barcode ID printed on the label:'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={manualInput}
              onChange={e => setManualInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && manualInput.trim() && lookupBarcode(manualInput)}
              placeholder="e.g. 2026-001-AGG-01"
              style={{ flex: 1, fontFamily: 'var(--mono)', fontWeight: 600, letterSpacing: '0.04em' }}
              autoFocus={!!cameraError}
            />
            <button className="btn btn-primary" onClick={() => manualInput.trim() && lookupBarcode(manualInput)} disabled={!manualInput.trim()}>
              Look up
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scanline {
          0%   { top: 8px; opacity: 1; }
          50%  { top: calc(100% - 8px); opacity: 1; }
          100% { top: 8px; opacity: 1; }
        }
      `}</style>
    </div>
  )
}
