import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { pdfjs } from 'react-pdf'
import './index.css'
import App from './App.jsx'

// Configure PDF.js worker - use local worker file to avoid CORS and version issues
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

// Debug logging
if (typeof window !== 'undefined') {
  console.log('PDF.js version:', pdfjs.version);
  console.log('Worker src:', pdfjs.GlobalWorkerOptions.workerSrc);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
