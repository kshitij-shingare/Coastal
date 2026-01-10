'use client'

import { useState } from 'react'

export default function MediaUploader() {
  const [files, setFiles] = useState<File[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Upload Media</label>
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />
      {files.length > 0 && (
        <p className="text-sm text-gray-600 mt-1">{files.length} file(s) selected</p>
      )}
    </div>
  )
}
