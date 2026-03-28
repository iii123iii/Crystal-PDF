import {
  FileStack,
  Scissors,
  RotateCcw,
  Trash2,
  ArrowUpDown,
  PenLine,
  ScanText,
  FileImage,
  FilePlus2,
  FileText,
  Lock,
  Unlock,
  ShieldX,
  Minimize2,
  Droplets,
  EyeOff,
  Hash,
  Type,
  ImageDown,
  Stamp,
  Crop,
  Wrench,
  FileCheck,
  AlignVerticalSpaceAround,
  type LucideIcon,
} from 'lucide-react'

export interface Tool {
  id: string
  label: string
  description: string
  icon: LucideIcon
  color: string
}

export interface ToolCategory {
  id: string
  label: string
  color: string
  tools: Tool[]
}

export const toolCategories: ToolCategory[] = [
  {
    id: 'organize',
    label: 'Organize & View',
    color: '#3b82f6',
    tools: [
      { id: 'merge', label: 'Merge PDF', description: 'Combine multiple PDFs into one document.', icon: FileStack, color: '#3b82f6' },
      { id: 'split', label: 'Split PDF', description: 'Extract pages or split into separate files.', icon: Scissors, color: '#3b82f6' },
      { id: 'rotate', label: 'Rotate Pages', description: 'Rotate one or all pages by 90, 180, or 270°.', icon: RotateCcw, color: '#3b82f6' },
      { id: 'delete-pages', label: 'Delete Pages', description: 'Remove unwanted pages from your PDF.', icon: Trash2, color: '#3b82f6' },
      { id: 'reorder', label: 'Reorder Pages', description: 'Drag and rearrange pages in any order.', icon: ArrowUpDown, color: '#3b82f6' },
      { id: 'crop', label: 'Crop Pages', description: 'Crop page margins and content area.', icon: Crop, color: '#3b82f6' },
      { id: 'annotate', label: 'Annotate', description: 'Draw, highlight, and add text to your PDF.', icon: PenLine, color: '#3b82f6' },
      { id: 'page-numbers', label: 'Page Numbers', description: 'Add page numbers to your document.', icon: Hash, color: '#3b82f6' },
      { id: 'header-footer', label: 'Header & Footer', description: 'Add custom headers and footers to pages.', icon: AlignVerticalSpaceAround, color: '#3b82f6' },
    ],
  },
  {
    id: 'convert',
    label: 'Convert & Extract',
    color: '#8b5cf6',
    tools: [
      { id: 'ocr', label: 'OCR PDF', description: 'Make scanned PDFs searchable with text recognition.', icon: ScanText, color: '#8b5cf6' },
      { id: 'pdf-to-image', label: 'PDF to Image', description: 'Convert pages to high-quality PNG or JPG.', icon: FileImage, color: '#8b5cf6' },
      { id: 'image-to-pdf', label: 'Image to PDF', description: 'Convert JPG or PNG images into a PDF.', icon: FilePlus2, color: '#8b5cf6' },
      { id: 'word-to-pdf', label: 'Word to PDF', description: 'Convert DOCX and XLSX files into PDF format.', icon: FileText, color: '#8b5cf6' },
      { id: 'extract-text', label: 'Extract Text', description: 'Extract all text content from your PDF.', icon: Type, color: '#8b5cf6' },
      { id: 'extract-images', label: 'Extract Images', description: 'Extract all embedded images from a PDF.', icon: ImageDown, color: '#8b5cf6' },
      { id: 'pdfa', label: 'Convert to PDF/A', description: 'Convert to PDF/A archival format for compliance.', icon: FileCheck, color: '#8b5cf6' },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    color: '#ef4444',
    tools: [
      { id: 'protect', label: 'Protect PDF', description: 'Encrypt your PDF with a password.', icon: Lock, color: '#ef4444' },
      { id: 'unlock', label: 'Unlock PDF', description: 'Remove password protection from a PDF.', icon: Unlock, color: '#ef4444' },
      { id: 'redact', label: 'Redact', description: 'Permanently black out sensitive content.', icon: EyeOff, color: '#ef4444' },
      { id: 'sanitize', label: 'Sanitize PDF', description: 'Strip metadata and hidden content from your PDF.', icon: ShieldX, color: '#ef4444' },
      { id: 'watermark', label: 'Watermark', description: 'Add text watermark to protect your document.', icon: Droplets, color: '#ef4444' },
      { id: 'stamp', label: 'Sign / Stamp', description: 'Add a signature or image stamp to pages.', icon: Stamp, color: '#ef4444' },
    ],
  },
  {
    id: 'optimize',
    label: 'Optimize & Repair',
    color: '#10b981',
    tools: [
      { id: 'compress', label: 'Compress PDF', description: 'Reduce file size while preserving quality.', icon: Minimize2, color: '#10b981' },
      { id: 'repair', label: 'Repair PDF', description: 'Fix corrupted or damaged PDF files.', icon: Wrench, color: '#10b981' },
    ],
  },
]

export const allTools: Tool[] = toolCategories.flatMap((c) => c.tools)

export function findTool(id: string): Tool | undefined {
  return allTools.find((t) => t.id === id)
}

export function findToolCategory(toolId: string): ToolCategory | undefined {
  return toolCategories.find((c) => c.tools.some((t) => t.id === toolId))
}
