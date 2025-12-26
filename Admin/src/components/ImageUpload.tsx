import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Upload, X, Image as ImageIcon, Loader2, GripVertical, ArrowUp, ArrowDown } from "lucide-react";

interface UploadedImage {
  url: string;
  path: string;
  original_name?: string;
}

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:1581';

export function ImageUpload({ images, onImagesChange, maxImages = 5, disabled = false }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const uploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    
    if (remainingSlots <= 0) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    const filesToUpload = fileArray.slice(0, remainingSlots);
    
    // Validate file types
    const validFiles = filesToUpload.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        alert(`${file.name}: Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name}: File too large. Maximum size is 5MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(`Uploading ${validFiles.length} image(s)...`);

    try {
      const formData = new FormData();
      validFiles.forEach(file => formData.append('files', file));

      const response = await fetch(`${API_URL}/api/admin/upload/images`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data?.uploaded) {
        const newUrls = result.data.uploaded.map((img: UploadedImage) => img.url);
        onImagesChange([...images, ...newUrls]);
        
        if (result.data.errors?.length > 0) {
          alert(`Some files failed to upload:\n${result.data.errors.join('\n')}`);
        }
      } else {
        alert(result.error || 'Failed to upload images');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadFiles(files);
    }
  }, [disabled, images, maxImages, onImagesChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async (index: number) => {
    const imageUrl = images[index];
    
    // Extract path from URL if needed
    // For now, just remove from UI
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Drag and drop handlers for reordering
  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    if (disabled) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleImageDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleImageDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const [draggedItem] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedItem);
    
    onImagesChange(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Move image up/down
  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (disabled) return;
    
    const newImages = [...images];
    if (direction === 'up' && index > 0) {
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      onImagesChange(newImages);
    } else if (direction === 'down' && index < images.length - 1) {
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      onImagesChange(newImages);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${isDragging 
            ? 'border-[#576D64] bg-[#576D64]/10' 
            : 'border-gray-300 hover:border-[#576D64] hover:bg-gray-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isUploading ? 'pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-[#576D64] animate-spin" />
            <p className="text-sm text-gray-600">{uploadProgress}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-[#576D64]/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-[#576D64]" />
            </div>
            <div>
              <p className="text-base font-medium text-black">
                {isDragging ? 'Drop images here' : 'Drag & drop images here'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                or click to browse • Max {maxImages} images • JPEG, PNG, WebP, GIF • Up to 5MB each
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Grid - Smaller and with reordering */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium">Drag images to reorder • First image is the main product image</p>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {images.map((imageUrl, index) => (
              <Card 
                key={index} 
                className={`
                  relative group overflow-hidden transition-all
                  ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
                  ${dragOverIndex === index ? 'ring-2 ring-[#576D64] ring-offset-2' : ''}
                `}
                draggable={!disabled}
                onDragStart={(e: React.DragEvent) => handleImageDragStart(e, index)}
                onDragOver={(e: React.DragEvent) => handleImageDragOver(e, index)}
                onDragLeave={handleImageDragLeave}
                onDrop={(e: React.DragEvent) => handleImageDrop(e, index)}
              >
                <CardContent className="p-0">
                  <div className="aspect-square relative">
                    <img
                      src={imageUrl}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                    {!disabled && (
                      <>
                        {/* Drag Handle */}
                        <div className="absolute top-1 left-1 bg-black/60 rounded p-1 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="w-3 h-3 text-white" />
                        </div>
                        
                        {/* Move Up/Down Buttons */}
                        <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {index > 0 && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-6 w-6 p-0 bg-black/60 hover:bg-black/80"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                moveImage(index, 'up');
                              }}
                            >
                              <ArrowUp className="w-3 h-3 text-white" />
                            </Button>
                          )}
                          {index < images.length - 1 && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-6 w-6 p-0 bg-black/60 hover:bg-black/80"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                moveImage(index, 'down');
                              }}
                            >
                              <ArrowDown className="w-3 h-3 text-white" />
                            </Button>
                          )}
                        </div>
                        
                        {/* Delete Button */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleRemoveImage(index);
                            }}
                            className="rounded-full h-7 w-7 p-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 bg-[#576D64] text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                        Main
                      </span>
                    )}
                    {/* Position Number */}
                    <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                      #{index + 1}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Add More Placeholder */}
            {images.length < maxImages && !disabled && (
              <Card 
                className="cursor-pointer hover:bg-gray-50 transition-colors border-dashed"
                onClick={handleClick}
              >
                <CardContent className="p-0">
                  <div className="aspect-square flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="w-6 h-6 mb-1" />
                    <span className="text-[10px]">Add More</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Image Count */}
      {images.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          {images.length} of {maxImages} images uploaded
        </p>
      )}
    </div>
  );
}
