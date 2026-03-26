import { FileStack, FilePlus2, Scissors, Lock, Unlock, FileImage, FileText, Minimize2, ScanText } from 'lucide-react'

const tools = [
  { icon: FileStack,  label: 'Merge PDF' },
  { icon: Scissors,   label: 'Split PDF' },
  { icon: Lock,       label: 'Protect PDF' },
  { icon: Unlock,     label: 'Unlock PDF' },
  { icon: FileImage,  label: 'PDF to Image' },
  { icon: FilePlus2,  label: 'Image to PDF' },
  { icon: FileText,   label: 'Word to PDF' },
  { icon: Minimize2,  label: 'Compress PDF' },
  { icon: ScanText,   label: 'OCR PDF' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col py-4">
      <div className="px-4 mb-6">
        <span className="text-xl font-bold tracking-tight text-white">Crystal-PDF</span>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {tools.map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400
                       hover:bg-gray-800 hover:text-white transition-colors text-left"
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
