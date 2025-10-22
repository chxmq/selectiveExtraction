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
  const [pos, setPos] = useState({ x: 24, y: 96 })
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const [isUploaderCollapsed, setIsUploaderCollapsed] = useState(false)
  const [highlights, setHighlights] = useState([])
  const [highlightPos, setHighlightPos] = useState({ x: 750, y: 96 })
  const highlightDragging = useRef(false)
  const highlightDragOffset = useRef({ x: 0, y: 0 })
  const [selectedColor, setSelectedColor] = useState('#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'))
  const [isHighlightSelectorVisible, setIsHighlightSelectorVisible] = useState(false)

  // Drag handlers (mouse)
  function handleDragStart(e) {
    // only left button or touch
    if (e.type === 'mousedown' && e.button !== 0) return
    dragging.current = true
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY
    dragOffset.current = { x: clientX - pos.x, y: clientY - pos.y }
    window.addEventListener('mousemove', handleDragMove)
    window.addEventListener('mouseup', handleDragEnd)
    window.addEventListener('touchmove', handleDragMove, { passive: false })
    window.addEventListener('touchend', handleDragEnd)
  }

  function handleDragMove(e) {
    if (!dragging.current) return
    // prevent scrolling while dragging on touch
    if (e.type === 'touchmove') e.preventDefault()
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY
    setPos({ x: clientX - dragOffset.current.x, y: clientY - dragOffset.current.y })
  }

  function handleDragEnd() {
    dragging.current = false
    window.removeEventListener('mousemove', handleDragMove)
    window.removeEventListener('mouseup', handleDragEnd)
    window.removeEventListener('touchmove', handleDragMove)
    window.removeEventListener('touchend', handleDragEnd)
  }

  // Highlight selector drag handlers
  function handleHighlightDragStart(e) {
    if (e.type === 'mousedown' && e.button !== 0) return
    highlightDragging.current = true
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY
    highlightDragOffset.current = { x: clientX - highlightPos.x, y: clientY - highlightPos.y }
    window.addEventListener('mousemove', handleHighlightDragMove)
    window.addEventListener('mouseup', handleHighlightDragEnd)
    window.addEventListener('touchmove', handleHighlightDragMove, { passive: false })
    window.addEventListener('touchend', handleHighlightDragEnd)
  }

  function handleHighlightDragMove(e) {
    if (!highlightDragging.current) return
    if (e.type === 'touchmove') e.preventDefault()
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY
    setHighlightPos({ x: clientX - highlightDragOffset.current.x, y: clientY - highlightDragOffset.current.y })
  }

  function handleHighlightDragEnd() {
    highlightDragging.current = false
    window.removeEventListener('mousemove', handleHighlightDragMove)
    window.removeEventListener('mouseup', handleHighlightDragEnd)
    window.removeEventListener('touchmove', handleHighlightDragMove)
    window.removeEventListener('touchend', handleHighlightDragEnd)
  }

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/hello')
      .then(r => r.json())
      .then(data => setMessage(data.message))
      .catch(() => setMessage('Backend not available'))
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
      // read file as ArrayBuffer for mammoth
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
      setSelectedColor('#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')) // new random for next
    }
  }

  function removeHighlight(index) {
    const updatedHighlights = highlights.filter((_, i) => i !== index)
    setHighlights(updatedHighlights)
    
    // Re-apply highlights by sending updated list to backend
    if (fileType === 'doc' && updatedHighlights.length > 0) {
      const content = plainText
      fetch(`http://127.0.0.1:5000/api/highlight?content=${encodeURIComponent(content)}&highlights=${encodeURIComponent(JSON.stringify(updatedHighlights))}`)
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
      // Reset to original HTML when all highlights removed
      setDocHtml(originalDocHtml)
    }
  }

  function handleSend() {
    // Send highlights to backend
    const content = fileType === 'doc' ? plainText : 'PDF content not extracted client-side'
    fetch(`http://127.0.0.1:5000/api/highlight?content=${encodeURIComponent(content)}&highlights=${encodeURIComponent(JSON.stringify(highlights))}`)
      .then(r => r.json())
      .then(data => {
        console.log('Sent:', data)
        // data.content is list of lists of words
        if (fileType === 'doc' && data.content && Array.isArray(data.content)) {
          let highlightedHtml = originalDocHtml
          data.content.forEach((words, index) => {
            const color = highlights[index]?.color || '#ffff00'
            words.forEach(word => {
              // Escape special regex chars in word
              const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
              // Replace all occurrences
              const regex = new RegExp(`(${escapedWord})`, 'gi')
              highlightedHtml = highlightedHtml.replace(regex, `<span style="background-color: ${color}">$1</span>`)
            })
          })
          setDocHtml(highlightedHtml)
        }
      })
      .catch(err => console.error('Send failed:', err))
  }

  return (
    <div className="app-root">
      <nav className="topnav">
        <div className="brand">Selective extraction</div>
        <div className="status">{message!=""?"Backend Online":"Backend Offline"}</div>
      </nav>

      <main className="container">
        {!isUploaderCollapsed && (
          <section className="uploader" style={{ left: pos.x, top: pos.y, position: 'absolute' }}>
            <div className="drag-handle" onMouseDown={handleDragStart} onTouchStart={handleDragStart} role="button" tabIndex={0} aria-label="Move uploader">☰</div>
            <label className="file-label">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFile}
              />
              <div className="drop-area">
                <div className="drop-title">Click to choose or drag a PDF / Word file</div>
                <div className="drop-sub">Supported: .pdf, .doc, .docx</div>
              </div>
            </label>
            <div className="actions">
              <button onClick={clearSelection} className="btn">Clear</button>
            </div>
          </section>
        )}

        {isHighlightSelectorVisible && (
          <section className="highlightSelector" style={{ left: highlightPos.x, top: highlightPos.y, position: 'absolute' }}>
            <div className="drag-handle" onMouseDown={handleHighlightDragStart} onTouchStart={handleHighlightDragStart} role="button" tabIndex={0} aria-label="Move highlight selector">☰</div>
            <h3>Highlight Selector</h3>
            <div className="add-highlight">
              <input type="color" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} />
              <input type="text" placeholder="Description" id="descInput" />
              <button onClick={() => {
                const desc = document.getElementById('descInput').value
                addHighlight(desc)
                document.getElementById('descInput').value = ''
              }} className="btn">Add</button>
            </div>
            <ul className="highlight-list">
              {highlights.map((hl, index) => (
                <li key={index} className="highlight-item">
                  <span className="color-swatch" style={{ backgroundColor: hl.color }}></span>
                  <span>{hl.description}</span>
                  <button onClick={() => removeHighlight(index)} className="remove-btn">×</button>
                </li>
              ))}
            </ul>
            <button onClick={handleSend} className="send-btn btn">Send</button>
          </section>
        )}

        <section className="preview">
          {fileType && (
            <div className="preview-header">
              <button onClick={() => setIsUploaderCollapsed(false)} className="btn">Upload another file</button>
            </div>
          )}
          {fileType === 'pdf' && pdfUrl && (
            <object data={pdfUrl} type="application/pdf" width="100%" height="600px">
              <p>PDF preview is not available. <a href={pdfUrl}>Download</a></p>
            </object>
          )}

          {fileType === 'doc' && (
            <div className="doc-preview" dangerouslySetInnerHTML={{ __html: docHtml }} />
          )}

          {!fileType && docHtml === '' && (
            <div className="placeholder">No file uploaded yet.</div>
          )}

          {docHtml && fileType !== 'doc' && (
            <div className="doc-preview" dangerouslySetInnerHTML={{ __html: docHtml }} />
          )}
        </section>
      </main>
    </div>
  )
}
