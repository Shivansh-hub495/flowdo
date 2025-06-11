"use client";

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, Image, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileAttachment } from '@/lib/a4f-api';
import { 
  processFile, 
  isFileSupported, 
  isFileSizeValid, 
  formatFileSize,
  getFileTypeIcon,
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_DOCUMENT_TYPES,
  MAX_FILE_SIZE
} from '@/lib/file-utils';

interface FileUploadProps {
  onFilesSelected: (files: FileAttachment[]) => void;
  maxFiles?: number;
  className?: string;
}

export function FileUpload({ onFilesSelected, maxFiles = 5, className }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFiles, setProcessingFiles] = useState<string[]>([]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files).slice(0, maxFiles);
    setIsProcessing(true);
    setProcessingFiles(fileArray.map(f => f.name));

    try {
      const processedFiles: FileAttachment[] = [];
      
      for (const file of fileArray) {
        try {
          const attachment = await processFile(file);
          processedFiles.push(attachment);
        } catch (error) {
          console.error('Error processing file:', file.name, error);
          // Still add the file with error state
          processedFiles.push({
            id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            type: file.type,
            size: file.size,
            url: '',
            processed: true,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      onFilesSelected(processedFiles);
    } finally {
      setIsProcessing(false);
      setProcessingFiles([]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const supportedTypes = [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_DOCUMENT_TYPES];

  return (
    <div className={cn("relative", className)}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={supportedTypes.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      
      <motion.div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all",
          "bg-white/[0.02] hover:bg-white/[0.05]",
          isDragOver
            ? "border-violet-400/50 bg-violet-500/10"
            : "border-white/[0.1] hover:border-white/[0.2]"
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <motion.div
            animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
            className={cn(
              "p-3 rounded-full transition-colors",
              isDragOver
                ? "bg-violet-500/20 text-violet-300"
                : "bg-white/[0.05] text-white/60"
            )}
          >
            <Upload className="w-6 h-6" />
          </motion.div>
          
          <div>
            <p className="text-white/80 font-medium mb-1">
              {isDragOver ? "Drop files here" : "Upload files"}
            </p>
            <p className="text-white/50 text-sm">
              Drag & drop or click to select
            </p>
            <p className="text-white/40 text-xs mt-2">
              Supports images, PDFs, and text files (max {formatFileSize(MAX_FILE_SIZE)})
            </p>
          </div>
        </div>
      </motion.div>

      {/* Processing indicator */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center backdrop-blur-sm"
          >
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-white/80 text-sm">Processing files...</p>
              {processingFiles.length > 0 && (
                <p className="text-white/60 text-xs mt-1">
                  {processingFiles.join(', ')}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FilePreviewProps {
  file: FileAttachment;
  onRemove: () => void;
  className?: string;
}

export function FilePreview({ file, onRemove, className }: FilePreviewProps) {
  const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border",
        "bg-white/[0.02] border-white/[0.1]",
        file.error && "border-red-400/30 bg-red-500/5",
        className
      )}
    >
      {/* File icon/preview */}
      <div className="flex-shrink-0">
        {isImage && file.url && !file.error ? (
          <img
            src={file.url}
            alt={file.name}
            className="w-10 h-10 rounded object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-white/[0.05] flex items-center justify-center text-lg">
            {getFileTypeIcon(file.type)}
          </div>
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-white/90 text-sm font-medium truncate">
          {file.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-white/50 text-xs">
            {formatFileSize(file.size)}
          </p>
          {file.processed && !file.error && (
            <CheckCircle className="w-3 h-3 text-green-400" />
          )}
          {file.error && (
            <AlertCircle className="w-3 h-3 text-red-400" />
          )}
        </div>
        {file.error && (
          <p className="text-red-400 text-xs mt-1 truncate">
            {file.error}
          </p>
        )}
      </div>

      {/* Remove button */}
      <motion.button
        onClick={onRemove}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="flex-shrink-0 p-1 text-white/40 hover:text-white/80 transition-colors"
      >
        <X className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}
