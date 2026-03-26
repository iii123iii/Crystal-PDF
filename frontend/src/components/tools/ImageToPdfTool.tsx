import { useRef, useState } from 'react'
import { ReactSortable } from 'react-sortablejs'
import { UploadCloud, GripVertical, X, Image, Download, Loader2 } from 'lucide-react'
import { useToastStore } from '../../store/useToastStore'

const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ACCEPT_STRING = ACCEPTED_MIME.join(',')

interface ImageFile {
  id: string
  file: File
  preview: string
}

export default function ImageToPdfTool() {
  const [images, setImages] = useState<ImageFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const addToast = useToastStore((s) => s.addToast)

  function addFiles(incoming: FileList | null) {
    if (!incoming) return
    const valid = Array.from(incoming).filter((f) => ACCEPTED_MIME.includes(f.type))
    if (valid.length !== incoming.length) setError('Only image files (JPG, PNG, WEBP, GIF) are accepted.')
    else setError(null)

    setImages((prev) => [
      ...prev,
      ...valid.map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        preview: URL.createObjectURL(f),
      })),
    ])
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item) URL.revokeObjectURL(item.preview)
      return prev.filter((i) => i.id !== id)
    })
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    addFiles(e.dataTransfer.files)
  }

  async function handleConvert() {
    if (images.length === 0) { setError('Add at least one image.'); return }
    setLoading(true)
    setError(null)

    const formData = new FormData()
    images.forEach(({ file }) => formData.append('files', file))

    try {
      const res = await fetch('/api/v1/convert/image-to-pdf', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'images.pdf'
      a.click()
      URL.revokeObjectURL(url)
      addToast('success', `${images.length} image${images.length > 1 ? 's' : ''} converted — downloading images.pdf`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Image to PDF</h2>
        <p className="text-slate-400 text-sm">
          Combine images into a PDF. Each image becomes one A4 page. Drag to reorder.
        </p>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-700
                   bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50 rounded-xl p-8
                   cursor-pointer transition-colors"
      >
        <UploadCloud size={28} className="text-slate-500" />
        <p className="text-sm text-slate-300 font-medium">
          Drag & drop images, or <span className="text-pink-400">browse</span>
        </p>
        <p className="text-xs text-slate-500">JPG, PNG, WEBP, GIF</p>
        <input ref={inputRef} type="file" accept={ACCEPT_STRING} multiple className="hidden"
          onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
      </div>

      {images.length > 0 && (
        <ReactSortable tag="ul" list={images} setList={setImages} handle=".drag-handle"
          animation={150} ghostClass="opacity-40" className="space-y-2">
          {images.map(({ id, file, preview }, index) => (
            <li key={id}
              className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/60 rounded-lg px-3 py-2 select-none">
              <span className="drag-handle cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 shrink-0">
                <GripVertical size={16} />
              </span>
              <span className="text-slate-500 text-xs w-5 text-right shrink-0">{index + 1}</span>
              <img src={preview} alt="" className="w-8 h-8 object-cover rounded shrink-0" />
              <Image size={14} className="text-pink-400 shrink-0" />
              <span className="text-sm text-white flex-1 truncate">{file.name}</span>
              <button onClick={() => removeImage(id)}
                className="text-slate-600 hover:text-red-400 transition-colors shrink-0">
                <X size={15} />
              </button>
            </li>
          ))}
        </ReactSortable>
      )}

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</p>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={handleConvert}
          disabled={loading || images.length === 0}
          className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 disabled:bg-slate-700
                     disabled:text-slate-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          {loading
            ? <><Loader2 size={15} className="animate-spin" /> Converting…</>
            : <><Download size={15} /> Convert to PDF</>}
        </button>
        {images.length > 0 && (
          <button onClick={() => { images.forEach((i) => URL.revokeObjectURL(i.preview)); setImages([]) }}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}
