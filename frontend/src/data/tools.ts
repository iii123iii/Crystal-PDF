import {
  FileStack,
  Scissors,
  Minimize2,
  ScanText,
  FileImage,
  FilePlus2,
  FileText,
  Lock,
  Unlock,
  PenLine,
  type LucideIcon,
} from 'lucide-react'

export interface Tool {
  id: string
  label: string
  description: string
  icon: LucideIcon
  color: string        // Tailwind text-* class for the icon
  borderHover: string  // Tailwind hover:border-* class for the card
}

export const tools: Tool[] = [
  {
    id: 'merge',
    label: 'Merge PDF',
    description: 'Combine multiple PDF files into a single document in any order.',
    icon: FileStack,
    color: 'text-blue-400',
    borderHover: 'hover:border-blue-500',
  },
  {
    id: 'split',
    label: 'Split PDF',
    description: 'Extract pages or split a PDF into multiple separate files.',
    icon: Scissors,
    color: 'text-purple-400',
    borderHover: 'hover:border-purple-500',
  },
  {
    id: 'compress',
    label: 'Compress PDF',
    description: 'Reduce PDF file size while preserving acceptable quality.',
    icon: Minimize2,
    color: 'text-green-400',
    borderHover: 'hover:border-green-500',
  },
  {
    id: 'ocr',
    label: 'OCR PDF',
    description: 'Make scanned PDFs searchable by extracting text with OCR.',
    icon: ScanText,
    color: 'text-orange-400',
    borderHover: 'hover:border-orange-500',
  },
  {
    id: 'pdf-to-image',
    label: 'PDF to Image',
    description: 'Convert PDF pages to high-quality PNG or JPG images.',
    icon: FileImage,
    color: 'text-cyan-400',
    borderHover: 'hover:border-cyan-500',
  },
  {
    id: 'image-to-pdf',
    label: 'Image to PDF',
    description: 'Convert JPG, PNG, or other images into a PDF document.',
    icon: FilePlus2,
    color: 'text-pink-400',
    borderHover: 'hover:border-pink-500',
  },
  {
    id: 'word-to-pdf',
    label: 'Word to PDF',
    description: 'Convert Word (.docx) and Excel (.xlsx) files into PDF format.',
    icon: FileText,
    color: 'text-indigo-400',
    borderHover: 'hover:border-indigo-500',
  },
  {
    id: 'protect',
    label: 'Protect PDF',
    description: 'Encrypt a PDF with a password to restrict access.',
    icon: Lock,
    color: 'text-red-400',
    borderHover: 'hover:border-red-500',
  },
  {
    id: 'unlock',
    label: 'Unlock PDF',
    description: 'Remove password protection from a PDF you have access to.',
    icon: Unlock,
    color: 'text-yellow-400',
    borderHover: 'hover:border-yellow-500',
  },
  {
    id: 'annotate',
    label: 'Annotate',
    description: 'Draw, highlight, and add text annotations directly on the PDF.',
    icon: PenLine,
    color: 'text-sky-400',
    borderHover: 'hover:border-sky-500',
  },
]
