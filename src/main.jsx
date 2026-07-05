import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { supabaseConfigError } from './lib/supabase.js'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#c5433a' }}>Terjadi kesalahan</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

function Root() {
  if (supabaseConfigError) {
    return (
      <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
        <h2 style={{ color: '#c5433a' }}>Konfigurasi belum lengkap</h2>
        <p>{supabaseConfigError}</p>
        <p>
          Buka Vercel → project ini → Settings → Environment Variables, tambahkan
          <code> VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code>, lalu redeploy.
        </p>
      </div>
    )
  }
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>
)
