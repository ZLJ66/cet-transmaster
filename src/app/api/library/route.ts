import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface LibraryItem {
  id: string
  title: string
  sentences: string[]
  reference?: string
}

interface LibraryCategory {
  id: string
  name: string
  items: LibraryItem[]
}

interface JsonItem {
  zh: string
  en?: string
}

interface JsonData {
  title: string
  items: JsonItem[]
}

function parseJsonFile(filePath: string): LibraryItem {
  const content = fs.readFileSync(filePath, 'utf-8')
  const data: JsonData = JSON.parse(content)
  
  const sentences = data.items.map(item => item.zh)
  const reference = data.items
    .filter(item => item.en && item.en.trim())
    .map(item => item.en)
    .join(' ')
  
  return {
    id: data.title,
    title: data.title,
    sentences,
    reference: reference || undefined
  }
}

function scanDirectory(dirPath: string, categoryId: string, categoryName: string): LibraryCategory {
  const items: LibraryItem[] = []
  
  if (!fs.existsSync(dirPath)) {
    return { id: categoryId, name: categoryName, items }
  }
  
  const files = fs.readdirSync(dirPath)
    .filter(f => f.endsWith('.json'))
    .sort()
  
  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const title = file.replace('.json', '')
    try {
      const item = parseJsonFile(filePath)
      if (item.sentences.length > 0) {
        items.push(item)
      }
    } catch (e) {
      console.error(`Error parsing ${file}:`, e)
    }
  }
  
  return { id: categoryId, name: categoryName, items }
}

export async function GET() {
  try {
    const libraryDir = path.join(process.cwd(), 'library')
    const categories: LibraryCategory[] = []
    
    const dirs = [
      { id: 'cet4', name: '四级真题', dir: '四级真题' },
      { id: 'cet6', name: '六级真题', dir: '六级真题' },
      { id: 'culture', name: '中国文化概况', dir: '中国文化概况' },
    ]
    
    for (const { id, name, dir } of dirs) {
      const category = scanDirectory(path.join(libraryDir, dir), id, name)
      if (category.items.length > 0) {
        categories.push(category)
      }
    }
    
    return NextResponse.json(categories)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load library' }, { status: 500 })
  }
}