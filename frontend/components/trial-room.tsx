"use client"

import { useState, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Download, 
  RefreshCw, 
  X, 
  User,
  Shirt,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react"

interface TrialRoomProps {
  productName: string
  productImageUrl: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1581'

export function TrialRoom({ productName, productImageUrl }: TrialRoomProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [personImage, setPersonImage] = useState<File | null>(null)
  const [personPreview, setPersonPreview] = useState<string>("")
  const [generatedImage, setGeneratedImage] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string>("")
  const [isDragging, setIsDragging] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [])

  const handleFileSelect = (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WebP image')
      return
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB')
      return
    }
    
    setError('')
    setPersonImage(file)
    setGeneratedImage('')
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPersonPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleGenerateTryOn = async () => {
    if (!personImage) {
      setError('Please upload your photo first')
      return
    }
    
    setIsGenerating(true)
    setError('')
    
    try {
      const formData = new FormData()
      formData.append('person_image', personImage)
      formData.append('product_image_url', productImageUrl)
      
      const response = await fetch(`${API_URL}/api/virtual-try-on`, {
        method: 'POST',
        body: formData,
      })
      
      const result = await response.json()
      
      if (result.success && result.data?.image) {
        setGeneratedImage(result.data.image)
      } else {
        setError(result.error || 'Failed to generate try-on image')
      }
    } catch (err) {
      console.error('Try-on error:', err)
      setError('Failed to connect to the server. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!generatedImage) return
    
    try {
      // Create a link and trigger download
      const link = document.createElement('a')
      link.href = generatedImage
      link.download = `virtual_try_on_${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Download error:', err)
    }
  }

  const handleReset = () => {
    setPersonImage(null)
    setPersonPreview('')
    setGeneratedImage('')
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 text-purple-700 gap-2 py-6 transition-all"
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">Virtual Trial Room</span>
          <span className="text-xs bg-purple-100 px-2 py-0.5 rounded-full ml-2">AI Powered</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Virtual Trial Room
            <span className="text-sm font-normal text-gray-500 ml-2">Powered by AI</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Instructions */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
            <h3 className="font-semibold text-purple-900 mb-2">How it works:</h3>
            <ol className="text-sm text-purple-800 space-y-1">
              <li>1. Upload a clear photo of yourself (full body or upper body works best)</li>
              <li>2. Click "Generate Try-On" to see yourself wearing <strong>{productName}</strong></li>
              <li>3. Download and share your virtual try-on!</li>
            </ol>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Your Photo Upload */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="w-4 h-4" />
                Your Photo
              </div>
              
              {!personPreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`
                    aspect-[3/4] border-2 border-dashed rounded-xl cursor-pointer
                    flex flex-col items-center justify-center gap-3 transition-all
                    ${isDragging 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="text-center px-4">
                    <p className="font-medium text-gray-700">
                      {isDragging ? 'Drop your photo here' : 'Upload Your Photo'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Drag & drop or click to browse
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      JPEG, PNG, WebP • Max 10MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-purple-200">
                  <img 
                    src={personPreview} 
                    alt="Your photo" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={handleReset}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Ready
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>

            {/* Product Image */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Shirt className="w-4 h-4" />
                Product
              </div>
              <div className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
                <img 
                  src={productImageUrl || '/placeholder.svg'} 
                  alt={productName}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-center text-gray-500 truncate">{productName}</p>
            </div>

            {/* Generated Result */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Sparkles className="w-4 h-4" />
                Try-On Result
              </div>
              <div className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                {isGenerating ? (
                  <div className="text-center space-y-3">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                      <Sparkles className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-sm text-gray-600 font-medium">AI is working its magic...</p>
                    <p className="text-xs text-gray-400">This may take 10-30 seconds</p>
                  </div>
                ) : generatedImage ? (
                  <img 
                    src={generatedImage} 
                    alt="Virtual try-on result" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center px-4 space-y-2">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gray-200 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">
                      Your virtual try-on will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center pt-4 border-t">
            {!generatedImage ? (
              <Button
                onClick={handleGenerateTryOn}
                disabled={!personImage || isGenerating}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Try-On
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleDownload}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Image
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Another Photo
                </Button>
              </>
            )}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-center text-gray-400 pt-2">
            AI-generated images are approximations and may not perfectly represent the actual product fit.
            For best results, use a well-lit photo with a neutral background.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

