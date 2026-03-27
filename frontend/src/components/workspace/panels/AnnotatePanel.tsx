import { Eraser, Highlighter, MousePointerClick, Pencil, Type } from 'lucide-react'

const TIPS = [
  { icon: Pencil,      color: '#93c5fd', title: 'Pen',       desc: 'Freehand draw in any color.' },
  { icon: Highlighter, color: '#fde68a', title: 'Highlight', desc: 'Semi-transparent strokes over content.' },
  { icon: Type,        color: '#d8b4fe', title: 'Text',      desc: 'Click on the page to place a text box. Drag to move, resize from the corner.' },
  { icon: Eraser,      color: '#94a3b8', title: 'Eraser',    desc: 'Hover over a stroke to erase it.' },
]

export default function AnnotatePanel() {
  return (
    <div className="p-4 flex flex-col gap-4">
      <div
        className="flex items-start gap-2.5 rounded-lg p-3"
        style={{ background: 'rgba(147,197,253,0.07)', border: '1px solid rgba(147,197,253,0.14)' }}
      >
        <MousePointerClick size={13} className="shrink-0 mt-0.5 text-blue-400" />
        <p className="text-xs leading-relaxed" style={{ color: '#93c5fd' }}>
          Use the toolbar above the PDF to switch tools, pick colors, and adjust stroke width.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-slate-600 uppercase tracking-widest">Tools</span>
        <div className="flex flex-col gap-2 mt-1">
          {TIPS.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="flex items-start gap-2.5">
              <div
                className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center mt-0.5"
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}
              >
                <Icon size={12} style={{ color }} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-300">{title}</p>
                <p className="text-[11px] text-slate-600 leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-lg px-3 py-2.5 text-[11px] leading-relaxed"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748b' }}
      >
        Annotations are stored in memory for this session. Use Undo or Clear in the toolbar to remove them.
      </div>
    </div>
  )
}
