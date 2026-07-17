"use client"

import React, { useState } from "react"
import Cropper from "react-easy-crop"
import { Camera, Trash2, Loader2, User } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface PhotoUploadProps {
  photoUrl?: string
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDelete: () => void
  isCropping: boolean
  setIsCropping: (value: boolean) => void
  cropImage: string | null
  onCropComplete: (croppedArea: any, croppedAreaPixels: any) => void
  onProcessCrop: () => Promise<void>
  isUploading?: boolean
}

export function PhotoUpload({
  photoUrl,
  onFileChange,
  onDelete,
  isCropping,
  setIsCropping,
  cropImage,
  onCropComplete,
  onProcessCrop,
  isUploading = false,
}: PhotoUploadProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm min-[380px]:flex-row min-[380px]:items-center min-[380px]:border-0 min-[380px]:p-0 min-[380px]:shadow-none">
      <div className="group relative flex items-center gap-3 min-[380px]:block">
        <Avatar className="h-16 w-16 border-2 border-slate-100 shadow-sm transition-all duration-300 group-hover:border-indigo-100 min-[380px]:h-20 min-[380px]:w-20">
          {photoUrl ? (
            <AvatarImage src={photoUrl} alt="Profile Photo" className="object-cover" />
          ) : (
            <AvatarFallback className="bg-slate-50 text-slate-300">
              <User className="h-8 w-8 min-[380px]:h-10 min-[380px]:w-10" />
            </AvatarFallback>
          )}
        </Avatar>
        
        <button
          onClick={handleUploadClick}
          className="absolute left-0 top-0 flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 min-[380px]:inset-0 min-[380px]:h-auto min-[380px]:w-auto"
        >
          <Camera className="h-5 w-5 min-[380px]:h-6 min-[380px]:w-6" />
        </button>
        
        {isUploading && (
          <div className="absolute left-0 top-0 z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white/60 min-[380px]:inset-0 min-[380px]:h-auto min-[380px]:w-auto">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-500 min-[380px]:h-6 min-[380px]:w-6" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h4 className="text-sm font-bold text-slate-800">Profile Photo</h4>
        <p className="mb-1 text-[12px] leading-relaxed text-slate-500">Professional photos increase visibility</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            className="h-8 rounded-lg border-[#edf1f8] px-3 text-xs font-semibold hover:bg-slate-50"
          >
            {photoUrl ? "Change Photo" : "Upload Photo"}
          </Button>
          {photoUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 px-3 rounded-lg text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Remove
            </Button>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept="image/*"
        className="hidden"
      />

      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        {/* max-h + overflow-y-auto so the cropper + footer fit a 375x667 phone.
            Cropper itself uses clamp() so it shrinks on small viewports. */}
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white border-none shadow-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Camera className="h-4 w-4 text-indigo-500" />
              </div>
              Crop Your Photo
            </DialogTitle>
          </DialogHeader>

          <div className="relative h-[clamp(220px,40dvh,350px)] w-full bg-slate-100 mt-6">
            {cropImage && (
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                cropShape="round"
                showGrid={false}
              />
            )}
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Zoom Level</label>
                <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{Math.round(zoom * 100)}%</span>
              </div>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(values) => setZoom(values[0])}
                className="py-2"
              />
            </div>

            <DialogFooter className="flex-row gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setIsCropping(false)}
                className="flex-1 h-11 rounded-xl text-slate-500 font-semibold hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                onClick={onProcessCrop}
                disabled={isUploading}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 hover:opacity-95"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Photo"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
