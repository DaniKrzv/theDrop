import { isMp3OrWavFile } from './audioFormats'

export interface FolderStructure {
  name: string
  files: File[]
  subfolders: FolderStructure[]
  path: string
}

export interface ProcessedFolder {
  name: string
  files: File[]
  totalFiles: number
  totalSize: number
  structure: FolderStructure
}

/**
 * Processes a FileList from a folder selection and creates a hierarchical structure
 */
export const processFolderUpload = (fileList: FileList): ProcessedFolder[] => {
  const files = Array.from(fileList)
  const validFiles = files.filter(isMp3OrWavFile)
  
  if (validFiles.length === 0) {
    return []
  }

  // Group files by their top-level folder
  const folderGroups = new Map<string, File[]>()
  
  for (const file of validFiles) {
    const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath
    if (!relativePath || !relativePath.includes('/')) {
      continue
    }
    
    const [topLevelFolder] = relativePath.split('/')
    if (!topLevelFolder) continue
    
    const existing = folderGroups.get(topLevelFolder) ?? []
    existing.push(file)
    folderGroups.set(topLevelFolder, existing)
  }

  return Array.from(folderGroups.entries()).map(([folderName, files]) => {
    const structure = buildFolderStructure(files, folderName)
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    
    return {
      name: folderName,
      files,
      totalFiles: files.length,
      totalSize,
      structure
    }
  })
}

/**
 * Builds a hierarchical folder structure from files
 */
const buildFolderStructure = (files: File[], rootName: string): FolderStructure => {
  const structure: FolderStructure = {
    name: rootName,
    files: [],
    subfolders: [],
    path: rootName
  }

  for (const file of files) {
    const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath
    if (!relativePath) continue

    const pathParts = relativePath.split('/').filter(Boolean)
    if (pathParts.length === 1) {
      // File is in root folder
      structure.files.push(file)
    } else {
      // File is in a subfolder
      addFileToStructure(structure, file, pathParts.slice(1))
    }
  }

  return structure
}

/**
 * Recursively adds a file to the folder structure
 */
const addFileToStructure = (structure: FolderStructure, file: File, pathParts: string[]): void => {
  if (pathParts.length === 1) {
    // File goes in this folder
    structure.files.push(file)
  } else {
    // File goes in a subfolder
    const [subfolderName, ...remainingPath] = pathParts
    let subfolder = structure.subfolders.find(sf => sf.name === subfolderName)
    
    if (!subfolder) {
      subfolder = {
        name: subfolderName,
        files: [],
        subfolders: [],
        path: `${structure.path}/${subfolderName}`
      }
      structure.subfolders.push(subfolder)
    }
    
    addFileToStructure(subfolder, file, remainingPath)
  }
}

/**
 * Flattens a folder structure to get all files in order
 */
export const flattenFolderStructure = (structure: FolderStructure): File[] => {
  const files: File[] = []
  
  // Add files from current folder
  files.push(...structure.files)
  
  // Add files from subfolders recursively
  for (const subfolder of structure.subfolders) {
    files.push(...flattenFolderStructure(subfolder))
  }
  
  return files
}

/**
 * Gets the total size of all files in a folder structure
 */
export const getFolderStructureSize = (structure: FolderStructure): number => {
  let size = structure.files.reduce((sum, file) => sum + file.size, 0)
  
  for (const subfolder of structure.subfolders) {
    size += getFolderStructureSize(subfolder)
  }
  
  return size
}

/**
 * Formats file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validates that a folder contains only audio files
 */
export const validateFolderContents = (files: File[]): {
  valid: boolean
  audioFiles: File[]
  invalidFiles: string[]
} => {
  const audioFiles: File[] = []
  const invalidFiles: string[] = []
  
  for (const file of files) {
    if (isMp3OrWavFile(file)) {
      audioFiles.push(file)
    } else {
      invalidFiles.push(file.name)
    }
  }
  
  return {
    valid: audioFiles.length > 0,
    audioFiles,
    invalidFiles
  }
}
