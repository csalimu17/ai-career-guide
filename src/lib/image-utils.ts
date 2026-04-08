export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    console.log("🖼️ Creating image from URL (length):", url.length)
    const image = new Image()
    image.addEventListener('load', () => {
      console.log("✅ Image loaded successfully")
      resolve(image)
    })
    image.addEventListener('error', (error) => {
      console.error("❌ Image failed to load:", error)
      reject(error)
    })
    // Only set anonymous if NOT a data URL or blob to avoid potential issues
    if (!url.startsWith('data:') && !url.startsWith('blob:')) {
      image.setAttribute('crossOrigin', 'anonymous')
    }
    image.src = url
  })

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180
}

/**
 * Returns the rotate container size and the center window for the container
 */
export function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation)

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

/**
 * This function was adapted from the one in the react-easy-crop project
 */
export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  flip = { horizontal: false, vertical: false },
  targetSize?: number // Optional: Resizes the output to this square dimension
): Promise<Blob | null> {
  console.log("🎯 Starting crop calculation...", { pixelCrop, rotation, flip, targetSize })
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    console.error("❌ Could not get canvas context")
    return null
  }

  const rotRad = getRadianAngle(rotation)

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  )

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
  ctx.translate(-image.width / 2, -image.height / 2)

  // draw rotated image
  ctx.drawImage(image, 0, 0)

  console.log("🖌️ Image drawn, extracting crop area...")

  const croppedCanvas = document.createElement('canvas')
  const croppedCtx = croppedCanvas.getContext('2d')

  if (!croppedCtx) {
    console.error("❌ Could not get cropped canvas context")
    return null
  }

  // Set the size of the cropped canvas
  const outWidth = targetSize || pixelCrop.width
  const outHeight = targetSize || pixelCrop.height
  croppedCanvas.width = outWidth
  croppedCanvas.height = outHeight

  // Draw the cropped image onto the new canvas
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outWidth,
    outHeight
  )

  console.log("📦 Extracting blob from cropped canvas...")

  // As a blob
  return new Promise((resolve, reject) => {
    try {
      croppedCanvas.toBlob((file) => {
        if (file) {
          console.log("✅ Blob extracted, size:", file.size)
          resolve(file)
        } else {
          console.error("❌ toBlob callback received null")
          resolve(null)
        }
      }, 'image/jpeg')
    } catch (err) {
      console.error("💥 toBlob exception:", err)
      reject(err)
    }
  })
}

/**
 * Converts a Blob to a Data URL (Base64 string)
 */
export const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
