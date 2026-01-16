import React, { useEffect, useState, useRef } from 'react'
import mammoth from 'mammoth'

export default function App() {
  const [message, setMessage] = useState('')
  const [fileType, setFileType] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [docHtml, setDocHtml] = useState('')
  const [plainText, setPlainText] = useState('')
  const [originalDocHtml, setOriginalDocHtml] = useState('')
  const fileInputRef = useRef()
  const [isUploaderCollapsed, setIsUploaderCollapsed] = useState(false)
  const [highlights, setHighlights] = useState([])
  const [selectedColor, setSelectedColor] = useState('#4285F4')
  const [isHighlightSelectorVisible, setIsHighlightSelectorVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Predefined color palette
  const colorPalette = ['#4285F4', '#34A853', '#EA4335', '#FBBC05', '#9B72F2', '#00BCD4', '#FF6B6B', '#4ECDC4']

  useEffect(() => {
    fetch('http://127.0.0.1:5001/api/hello')
      .then(r => r.json())
      .then(data => setMessage(data.message))
      .catch(() => setMessage('Backend Offline'))
  }, [])

  function handleFile(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return

    const name = file.name.toLowerCase()
    if (name.endsWith('.pdf')) {
      setFileType('pdf')
      setDocHtml('')
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
      setPdfUrl(URL.createObjectURL(file))
      setIsUploaderCollapsed(true)
      setIsHighlightSelectorVisible(true)
    } else if (name.endsWith('.docx') || name.endsWith('.doc')) {
      setFileType('doc')
      setPdfUrl(null)
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result
          const htmlResult = await mammoth.convertToHtml({ arrayBuffer })
          const textResult = await mammoth.extractRawText({ arrayBuffer })
          setDocHtml(htmlResult.value)
          setOriginalDocHtml(htmlResult.value)
          setPlainText(textResult.value)
        } catch (err) {
          setDocHtml(err)
          setPlainText('Error reading document')
        }
      }
      reader.readAsArrayBuffer(file)
      setIsUploaderCollapsed(true)
      setIsHighlightSelectorVisible(true)
    } else {
      setFileType(null)
      setPdfUrl(null)
      setDocHtml('<p>Unsupported file type. Please upload PDF or DOCX.</p>')
      setIsUploaderCollapsed(false)
    }
  }

  function clearSelection() {
    setFileType(null)
    setPdfUrl(null)
    setDocHtml('')
    setOriginalDocHtml('')
    setPlainText('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    setIsUploaderCollapsed(false)
    setIsHighlightSelectorVisible(false)
  }

  function addHighlight(description) {
    if (description.trim()) {
      setHighlights([...highlights, { color: selectedColor, description: description.trim() }])
      // Cycle to next color in palette
      const currentIndex = colorPalette.indexOf(selectedColor)
      const nextIndex = (currentIndex + 1) % colorPalette.length
      setSelectedColor(colorPalette[nextIndex])
    }
  }

  function removeHighlight(index) {
    const updatedHighlights = highlights.filter((_, i) => i !== index)
    setHighlights(updatedHighlights)
    
    if (fileType === 'doc' && updatedHighlights.length > 0) {
      const content = plainText
      fetch(`http://127.0.0.1:5001/api/highlight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, highlights: updatedHighlights })
      })
        .then(r => r.json())
        .then(data => {
          if (data.content && Array.isArray(data.content)) {
            let highlightedHtml = originalDocHtml
            data.content.forEach((words, idx) => {
              const color = updatedHighlights[idx]?.color || '#ffff00'
              words.forEach(word => {
                const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                const regex = new RegExp(`(${escapedWord})`, 'gi')
                highlightedHtml = highlightedHtml.replace(regex, `<span style="background-color: ${color}">$1</span>`)
              })
            })
            setDocHtml(highlightedHtml)
          }
        })
        .catch(err => console.error('Re-highlight failed:', err))
    } else if (updatedHighlights.length === 0) {
      setDocHtml(originalDocHtml)
    }
  }

  function handleSend() {
    setIsLoading(true)
    const content = fileType === 'doc' ? plainText : 'PDF content not extracted client-side'
    fetch(`http://127.0.0.1:5001/api/highlight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, highlights })
    })
      .then(r => r.json())
      .then(data => {
        console.log('Sent:', data)
        if (fileType === 'doc' && data.content && Array.isArray(data.content)) {
          let highlightedHtml = originalDocHtml
          data.content.forEach((words, index) => {
            const color = highlights[index]?.color || '#ffff00'
            words.forEach(word => {
              const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
              const regex = new RegExp(`(${escapedWord})`, 'gi')
              highlightedHtml = highlightedHtml.replace(regex, `<span style="background-color: ${color}">$1</span>`)
            })
          })
          setDocHtml(highlightedHtml)
        }
      })
      .catch(err => console.error('Send failed:', err))
      .finally(() => setIsLoading(false))
  }

  return (
    <div className="app-root">
      <nav className="topnav">
        <div className="brand">Selective Extraction</div>
        <div className="status" style={{ color: message === 'Hello from Flask backend!' ? '#34A853' : '#EA4335' }}>
          {message === 'Hello from Flask backend!' ? 'Online' : message === 'Backend Offline' ? 'Offline' : 'Connecting...'}
        </div>
      </nav>

      <main className="container">
        <aside className="sidebar">
          {!isUploaderCollapsed && (
            <section className="uploader glass-panel">
              <label className="file-label">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleFile}
                />
                <div className="drop-area">
                  <div className="drop-title">
                    Drop your document
                  </div>
                  <div className="drop-sub">Supports PDF & DOCX files</div>
                </div>
              </label>
              <div className="actions">
                <button onClick={clearSelection} className="btn secondary" style={{ width: '100%' }}>
                  Clear Selection
                </button>
              </div>
            </section>
          )}

          {isHighlightSelectorVisible && (
            <section className="highlightSelector glass-panel">
              <h3>Extraction Rules</h3>
              <div className="add-highlight">
                <input 
                  type="color" 
                  value={selectedColor} 
                  onChange={(e) => setSelectedColor(e.target.value)} 
                  title="Choose highlight color"
                />
                <input 
                  type="text" 
                  placeholder="What should I extract?" 
                  id="descInput" 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const desc = document.getElementById('descInput').value
                      addHighlight(desc)
                      document.getElementById('descInput').value = ''
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    const desc = document.getElementById('descInput').value
                    addHighlight(desc)
                    document.getElementById('descInput').value = ''
                  }} 
                  className="btn"
                >
                  Add
                </button>
              </div>
              
              {highlights.length > 0 && (
                <ul className="highlight-list">
                  {highlights.map((hl, index) => (
                    <li key={index} className="highlight-item">
                      <span className="color-swatch" style={{ backgroundColor: hl.color }} />
                      <span>{hl.description}</span>
                      <button 
                        onClick={() => removeHighlight(index)} 
                        className="remove-btn"
                        title="Remove this rule"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              
              <button 
                onClick={handleSend} 
                className="send-btn btn"
                disabled={highlights.length === 0 || isLoading}
                style={{ opacity: highlights.length === 0 ? 0.5 : 1 }}
              >
                {isLoading ? 'Extracting...' : 'Extract Highlights'}
              </button>
            </section>
          )}
        </aside>

        <section className="preview">
          {fileType && (
            <div className="preview-header">
              <div>
                {fileInputRef.current?.files[0]?.name || 'Document'}
              </div>
              <button onClick={() => setIsUploaderCollapsed(false)} className="btn secondary">
                Change File
              </button>
            </div>
          )}
          
          {fileType === 'pdf' && pdfUrl && (
            <div className="pdf-container">
              <div className="pdf-warning">
                <strong>Note:</strong> Automatic highlighting is currently only supported for .docx files.
              </div>
              <object data={pdfUrl} type="application/pdf" width="100%" height="100%">
                <p>PDF preview is not available. <a href={pdfUrl} style={{ color: '#4285F4' }}>Download instead</a></p>
              </object>
            </div>
          )}

          {fileType === 'doc' && (
            <div className="doc-preview" dangerouslySetInnerHTML={{ __html: docHtml }} />
          )}

          {!fileType && docHtml === '' && (
            <div className="placeholder">
              <h2>Ready to Extract</h2>
              <p>
                Upload a document to begin AI-powered selective extraction. 
                Define what you're looking for and we'll highlight it for you.
              </p>
            </div>
          )}

          {docHtml && fileType !== 'doc' && (
            <div className="doc-preview" dangerouslySetInnerHTML={{ __html: docHtml }} />
          )}
        </section>
      </main>
    </div>
  )
}
