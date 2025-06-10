import React, { useState, useRef } from 'react';
import styles from './UploadControls.module.css';

const UploadControls = ({ 
  onVideoUpload, 
  videoType = 'video', 
  currentVideo = null,
  disabled = false 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // File selection handler
  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Please select a video file (MP4, MOV, AVI, etc.)');
      return;
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      alert('File size must be less than 50MB');
      return;
    }

    setIsUploading(true);
    
    try {
      // Create object URL for the video
      const videoUrl = URL.createObjectURL(file);
      
      // Call parent handler with file data
      await onVideoUpload({
        file,
        url: videoUrl,
        name: file.name,
        size: file.size,
        type: file.type
      }, videoType);
      
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Error uploading video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle click to browse
  const handleBrowseClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle remove video
  const handleRemoveVideo = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onVideoUpload(null, videoType);
  };

  return (
    <div className={styles.uploadContainer}>
      {currentVideo ? (
        // Show uploaded video preview
        <div className={styles.videoPreview}>
          <div className={styles.videoInfo}>
            <h4>{currentVideo.name}</h4>
            <p>{(currentVideo.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
          <div className={styles.videoActions}>
            <button 
              onClick={handleBrowseClick}
              className={styles.changeButton}
              disabled={disabled || isUploading}
            >
              Change Video
            </button>
            <button 
              onClick={handleRemoveVideo}
              className={styles.removeButton}
              disabled={disabled || isUploading}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        // Show upload area
        <div 
          className={`${styles.uploadArea} ${isDragOver ? styles.dragOver : ''} ${disabled ? styles.disabled : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          {isUploading ? (
            <div className={styles.uploadingState}>
              <div className={styles.spinner}></div>
              <p>Uploading video...</p>
            </div>
          ) : (
            <div className={styles.uploadPrompt}>
              <div className={styles.uploadIcon}>📹</div>
              <h3>Drop {videoType} video here</h3>
              <p>or click to browse files</p>
              <span className={styles.supportedFormats}>
                Supports: MP4, MOV, AVI (max 50MB)
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileInputChange}
        className={styles.hiddenInput}
        disabled={disabled || isUploading}
      />
    </div>
  );
};

export default UploadControls;