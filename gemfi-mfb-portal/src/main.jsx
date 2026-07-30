import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import { BrandingProvider } from '@/lib/branding'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrandingProvider>
    <App />
  </BrandingProvider>
)
