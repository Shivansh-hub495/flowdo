import { FileAttachment } from './a4f-api';

// Supported file types
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
];

export const SUPPORTED_DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validates if a file is supported
 */
export function isFileSupported(file: File): boolean {
  return [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_DOCUMENT_TYPES].includes(file.type);
}

/**
 * Validates file size
 */
export function isFileSizeValid(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * Converts file to base64 data URL
 */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts text from PDF files using PDF.js (would need to be installed)
 * For now, returns a placeholder
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  // This is a placeholder implementation
  // In a real implementation, you would use PDF.js or similar library
  console.log('PDF text extraction not yet implemented for:', file.name);
  return `[PDF content from ${file.name} - text extraction would be implemented here]`;
}

/**
 * Extracts text from text files
 */
export function extractTextFromTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Processes a file and creates a FileAttachment object
 */
export async function processFile(file: File): Promise<FileAttachment> {
  const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log('Processing file:', {
    name: file.name,
    type: file.type,
    size: file.size,
    id
  });

  if (!isFileSupported(file)) {
    const error = `File type ${file.type} is not supported. Supported types: ${[...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_DOCUMENT_TYPES].join(', ')}`;
    console.error('File type not supported:', error);
    throw new Error(error);
  }

  if (!isFileSizeValid(file)) {
    const error = `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`;
    console.error('File size too large:', error);
    throw new Error(error);
  }

  const attachment: FileAttachment = {
    id,
    name: file.name,
    type: file.type,
    size: file.size,
    url: '',
    processed: false
  };

  try {
    console.log('Converting file to data URL...');
    // Convert to data URL for display and API usage
    attachment.url = await fileToDataURL(file);
    console.log('File converted to data URL successfully, length:', attachment.url.length);

    // Extract text content if it's a text-based file
    if (file.type === 'text/plain' || file.type === 'text/markdown') {
      console.log('Extracting text from text file...');
      attachment.content = await extractTextFromTextFile(file);
      console.log('Text extracted successfully, length:', attachment.content?.length);
    } else if (file.type === 'application/pdf') {
      console.log('Extracting text from PDF file...');
      attachment.content = await extractTextFromPDF(file);
      console.log('PDF text extracted successfully, length:', attachment.content?.length);
    }

    attachment.processed = true;
    console.log('File processed successfully:', attachment.id);
    return attachment;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error processing file:', {
      fileName: file.name,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    attachment.error = errorMessage;
    attachment.processed = true;
    return attachment;
  }
}

/**
 * Gets file type icon based on MIME type
 */
export function getFileTypeIcon(type: string): string {
  if (SUPPORTED_IMAGE_TYPES.includes(type)) {
    return '🖼️';
  } else if (type === 'application/pdf') {
    return '📄';
  } else if (type.startsWith('text/')) {
    return '📝';
  } else if (type.includes('word')) {
    return '📄';
  }
  return '📎';
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Creates a preview URL for images
 */
export function createImagePreview(file: File): Promise<string> {
  return fileToDataURL(file);
}
