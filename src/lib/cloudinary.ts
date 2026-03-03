// Browser-compatible Cloudinary utilities
// Note: We avoid importing the Node.js SDK to prevent process.env issues

// Upload configuration for different types of content
export const uploadConfigs = {
  // Profile pictures
  profile: {
    folder: 'lovex/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_file_size: 5000000, // 5MB
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  },
  
  // Gift animations and icons
  gifts: {
    folder: 'lovex/gifts',
    allowed_formats: ['gif', 'webp', 'mp4', 'jpg', 'png'],
    max_file_size: 10000000, // 10MB
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  },
  
  // Live room thumbnails
  live_rooms: {
    folder: 'lovex/live-rooms',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_file_size: 2000000, // 2MB
    transformation: [
      { width: 640, height: 360, crop: 'fill' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  },
  
  // Chat images and media
  chat: {
    folder: 'lovex/chat',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov'],
    max_file_size: 15000000, // 15MB
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  },
  
  // Verification documents
  verification: {
    folder: 'lovex/verification',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    max_file_size: 10000000, // 10MB
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  }
}

// Client-side upload function (uses upload preset)
export const uploadToCloudinary = async (
  file: File,
  type: keyof typeof uploadConfigs
): Promise<{ url: string; public_id: string }> => {
  const config = uploadConfigs[type]
  const formData = new FormData()
  
  formData.append('file', file)
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)
  formData.append('folder', config.folder)
  
  // Add transformations for profile pictures
  if (type === 'profile') {
    formData.append('transformation', 
      config.transformation.map(t => JSON.stringify(t)).join('|')
    )
  }
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    )
    
    if (!response.ok) {
      throw new Error('Upload failed')
    }
    
    const result = await response.json()
    
    return {
      url: result.secure_url,
      public_id: result.public_id
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw error
  }
}

// Generate optimized image URLs (browser-compatible)
export const getOptimizedUrl = (
  publicId: string,
  options: {
    width?: number
    height?: number
    crop?: string
    gravity?: string
    quality?: string
    format?: string
  } = {}
): string => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const defaultOptions = {
    quality: 'auto:good',
    fetch_format: 'auto',
    ...options
  }
  
  // Build transformation string
  const transformations = []
  if (defaultOptions.width) transformations.push(`w_${defaultOptions.width}`)
  if (defaultOptions.height) transformations.push(`h_${defaultOptions.height}`)
  if (defaultOptions.crop) transformations.push(`c_${defaultOptions.crop}`)
  if (defaultOptions.gravity) transformations.push(`g_${defaultOptions.gravity}`)
  if (defaultOptions.quality) transformations.push(`q_${defaultOptions.quality}`)
  if (defaultOptions.format) transformations.push(`f_${defaultOptions.format}`)
  
  const transformationString = transformations.join(',')
  
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformationString}/${publicId}`
}

// Generate video thumbnail URLs (browser-compatible)
export const getVideoThumbnail = (
  publicId: string,
  options: {
    width?: number
    height?: number
    start_offset?: string
  } = {}
): string => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const width = options.width || 640
  const height = options.height || 360
  const startOffset = options.start_offset || 'auto'
  
  return `https://res.cloudinary.com/${cloudName}/video/upload/w_${width},h_${height},c_fill,so_${startOffset}/${publicId}.jpg`
}

// Delete files from Cloudinary
export const deleteFromCloudinary = async (
  publicIds: string[],
  type: 'image' | 'video' = 'image'
): Promise<void> => {
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/${type}/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_ids: publicIds,
          invalidate: true
        })
      }
    )
    
    if (!response.ok) {
      throw new Error('Delete failed')
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    throw error
  }
}

// Generate signed URLs for private content (browser-compatible)
export const getSignedUrl = (
  publicId: string,
  options: any = {},
  expiresIn: number = 3600
): string => {
  // Note: Signed URLs require server-side signature generation
  // This is a placeholder for client-side usage
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const timestamp = Math.floor(Date.now() / 1000) + expiresIn
  
  // Build transformation string
  const transformations = []
  Object.entries(options).forEach(([key, value]) => {
    if (key !== 'sign_url' && key !== 'expires_at') {
      transformations.push(`${key}_${value}`)
    }
  })
  
  const transformationString = transformations.join(',')
  
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformationString}/s--${timestamp}--/${publicId}`
}

// Validate file before upload
export const validateFile = (
  file: File,
  type: keyof typeof uploadConfigs
): { valid: boolean; error?: string } => {
  const config = uploadConfigs[type]
  
  // Check file size
  if (file.size > config.max_file_size) {
    return {
      valid: false,
      error: `File size must be less than ${config.max_file_size / 1000000}MB`
    }
  }
  
  // Check file type
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  if (!fileExtension || !config.allowed_formats.includes(fileExtension)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${config.allowed_formats.join(', ')}`
    }
  }
  
  return { valid: true }
}

// Preset configurations for different upload types
export const uploadPresets = {
  profile: 'lovex_profile_preset',
  gifts: 'lovex_gifts_preset',
  live_rooms: 'lovex_live_rooms_preset',
  chat: 'lovex_chat_preset',
  verification: 'lovex_verification_preset'
}

// Export cloudinary utilities (browser-compatible)
export default {
  url: getOptimizedUrl,
  video_url: getVideoThumbnail,
  config: () => {}, // No-op for browser compatibility
}
