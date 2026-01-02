"use client"

import { useState, useRef, useCallback, useEffect } from "react"
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
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react"

interface TrialRoomProps {
  productName: string
  productImageUrl: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1581'

// Thinking messages list
const THINKING_MESSAGES = [
  "Just Look Perfect On You",
  "We are Just Try-On This",
  "Creating Your Perfect Look",
  "AI is Crafting Your Style",
  "Almost There, Looking Great!",
  "Making Magic Happen",
  "Styling You Up",
  "Perfect Fit Coming Soon"
]

export function TrialRoom({ productName, productImageUrl }: TrialRoomProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isResultOpen, setIsResultOpen] = useState(false)
  const [personImage, setPersonImage] = useState<File | null>(null)
  const [personPreview, setPersonPreview] = useState<string>("")
  const [generatedImage, setGeneratedImage] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string>("")
  const [isDragging, setIsDragging] = useState(false)
  const [currentThinkingMessage, setCurrentThinkingMessage] = useState(0)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Rotate thinking messages during generation
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setCurrentThinkingMessage((prev) => (prev + 1) % THINKING_MESSAGES.length)
      }, 2000) // Change message every 2 seconds
      return () => clearInterval(interval)
    }
  }, [isGenerating])

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
        setIsGenerating(false)
        // Close the upload dialog and open the result dialog
        setIsOpen(false)
        setTimeout(() => {
          setIsResultOpen(true)
        }, 300)
      } else {
        setError(result.error || 'Failed to generate try-on image')
        setIsGenerating(false)
      }
    } catch (err) {
      console.error('Try-on error:', err)
      setError('Failed to connect to the server. Please try again.')
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
    setIsResultOpen(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleTryAnother = () => {
    setIsResultOpen(false)
    setGeneratedImage('')
    setPersonImage(null)
    setPersonPreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setTimeout(() => {
      setIsOpen(true)
    }, 300)
  }

  return (
    <>
      {/* Upload Dialog */}
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
        
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-6 h-6 text-purple-600" />
              Virtual Trial Room
              <span className="text-sm font-normal text-gray-500 ml-2">Powered by AI</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Side - Instructions */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-100 h-full">
                  <h3 className="font-semibold text-purple-900 mb-4 text-lg">How it works:</h3>
                  <ol className="text-sm text-purple-800 space-y-3">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-purple-600">1.</span>
                      <span>Upload a clear photo of yourself (full body or upper body works best)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-purple-600">2.</span>
                      <span>Click "Generate Try-On" to see yourself wearing <strong>{productName}</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-purple-600">3.</span>
                      <span>Download and share your virtual try-on!</span>
                    </li>
                  </ol>
                  
                  {/* Disclaimer */}
                  <div className="mt-6 pt-4 border-t border-purple-200">
                    <p className="text-xs text-gray-600">
                      AI-generated images are approximations and may not perfectly represent the actual product fit.
                      For best results, use a well-lit photo with a neutral background.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Side - Upload Section */}
              <div className="space-y-4">
                {!personPreview && !isGenerating ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`
                      min-h-[400px] border-2 border-dashed rounded-xl cursor-pointer
                      flex flex-col items-center justify-center gap-4 transition-all p-8
                      ${isDragging 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center">
                      <Upload className="w-12 h-12 text-purple-600" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-xl font-semibold text-gray-700">
                        {isDragging ? 'Drop your photo here' : 'Upload Your Photo'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Drag & drop or click to browse
                      </p>
                      <p className="text-xs text-gray-400">
                        JPEG, PNG, WebP • Max 10MB
                      </p>
                    </div>
                  </div>
                ) : isGenerating ? (
                  <div className="min-h-[400px] flex flex-col items-center justify-center gap-6 p-8 border-2 border-dashed border-purple-200 rounded-xl bg-purple-50">
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                      <Sparkles className="w-10 h-10 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-lg font-semibold text-gray-700 animate-pulse">
                        {THINKING_MESSAGES[currentThinkingMessage]}
                      </p>
                      <p className="text-sm text-gray-500">
                        This may take 10-30 seconds
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-purple-200 shadow-lg">
                      <img 
                        src={personPreview} 
                        alt="Your photo" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={handleReset}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-green-500 text-white text-sm px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                        <CheckCircle2 className="w-4 h-4" />
                        Ready to Generate
                      </div>
                    </div>
                    <Button
                      onClick={handleGenerateTryOn}
                      disabled={!personImage || isGenerating}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg gap-2"
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
                  </div>
                )}
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleInputChange}
              className="hidden"
            />

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-center text-gray-400 pt-2">
              AI-generated images are approximations and may not perfectly represent the actual product fit.
              For best results, use a well-lit photo with a neutral background.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Dialog - Large Popup */}
      <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
        <DialogContent className="max-w-[98vw] w-[98vw] md:max-w-[95vw] md:w-[95vw] lg:max-w-[90vw] lg:w-[90vw] xl:max-w-[85vw] xl:w-[85vw] h-[95vh] max-h-[95vh] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <Sparkles className="w-7 h-7 text-purple-600" />
                Your Virtual Try-On Result
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsResultOpen(false)}
                className="h-8 w-8"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
            {generatedImage && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                <div className="relative w-full max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl h-full max-h-[calc(95vh-200px)] flex items-center justify-center">
                  <img 
                    src={generatedImage} 
                    alt="Virtual try-on result" 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  />
                </div>
                
                <div className="flex flex-wrap gap-4 justify-center pt-4">
                  <Button
                    onClick={handleDownload}
                    className="bg-green-600 hover:bg-green-700 text-white gap-2 px-6 py-3 text-base"
                  >
                    <Download className="w-5 h-5" />
                    Download Image
                  </Button>
                  <Button
                    onClick={handleTryAnother}
                    variant="outline"
                    className="gap-2 px-6 py-3 text-base border-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Try Another Photo
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}








