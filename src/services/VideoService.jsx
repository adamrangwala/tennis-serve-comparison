// File: src/services/VideoService.js

class VideoService {
  constructor() {
    // Global controls registry for synchronization
    window.videoPlayerControls = window.videoPlayerControls || {};
    this.syncEnabled = false;
    this.masterVideo = null; // 'user' or 'professional'
    this.syncTolerance = 0.1; // seconds
  }

  // Video validation
  validateVideoFile(file) {
    const errors = [];
    const warnings = [];

    // Check file type
    if (!file || !file.type.startsWith('video/')) {
      errors.push('File must be a video format (MP4, MOV, AVI, etc.)');
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file && file.size > maxSize) {
      errors.push('File size must be less than 50MB');
    }

    // Check common video formats
    const supportedFormats = [
      'video/mp4',
      'video/quicktime', // .mov
      'video/x-msvideo', // .avi
      'video/webm',
      'video/ogg'
    ];

    if (file && !supportedFormats.includes(file.type)) {
      warnings.push('This video format may not be supported in all browsers');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Extract video metadata using a video element
  async extractVideoMetadata(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      let url = null;
      
      try {
        url = URL.createObjectURL(file);
        
        video.onloadedmetadata = () => {
          const metadata = {
            duration: video.duration,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            aspectRatio: video.videoWidth / video.videoHeight,
            fileSize: file.size,
            fileName: file.name,
            fileType: file.type,
            // Estimate frame rate (this is approximate)
            estimatedFrameRate: 30 // Default assumption, real detection is complex
          };

          // Clean up the temporary URL
          URL.revokeObjectURL(url);
          resolve(metadata);
        };

        video.onerror = (error) => {
          console.error('Error loading video for metadata:', error);
          if (url) URL.revokeObjectURL(url);
          reject(new Error('Failed to load video metadata'));
        };

        video.src = url;
      } catch (error) {
        if (url) URL.revokeObjectURL(url);
        reject(new Error('Failed to create video URL for metadata extraction'));
      }
    });
  }

  // Generate video thumbnail
  async generateThumbnail(file, timeOffset = 1) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let url = null;

      try {
        url = URL.createObjectURL(file);

        video.onloadedmetadata = () => {
          // Set canvas size to maintain aspect ratio
          const maxWidth = 320;
          const maxHeight = 240;
          const aspectRatio = video.videoWidth / video.videoHeight;

          if (aspectRatio > maxWidth / maxHeight) {
            canvas.width = maxWidth;
            canvas.height = maxWidth / aspectRatio;
          } else {
            canvas.height = maxHeight;
            canvas.width = maxHeight * aspectRatio;
          }

          // Seek to the specified time
          video.currentTime = Math.min(timeOffset, video.duration * 0.1);
        };

        video.onseeked = () => {
          try {
            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert to data URL
            const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
            
            // Clean up the temporary URL
            if (url) URL.revokeObjectURL(url);
            resolve(thumbnail);
          } catch (error) {
            console.error('Error generating thumbnail:', error);
            if (url) URL.revokeObjectURL(url);
            reject(new Error('Failed to generate thumbnail'));
          }
        };

        video.onerror = (error) => {
          console.error('Error loading video for thumbnail:', error);
          if (url) URL.revokeObjectURL(url);
          reject(new Error('Failed to load video for thumbnail'));
        };

        video.src = url;
      } catch (error) {
        if (url) URL.revokeObjectURL(url);
        reject(new Error('Failed to create video URL for thumbnail generation'));
      }
    });
  }

  // Synchronization methods
  enableSync(masterVideo = 'user') {
    this.syncEnabled = true;
    this.masterVideo = masterVideo;
    console.log(`Video sync enabled with ${masterVideo} as master`);
  }

  disableSync() {
    this.syncEnabled = false;
    this.masterVideo = null;
    console.log('Video sync disabled');
  }

  // Synchronized play
  async syncPlay() {
    if (!this.syncEnabled) return;

    const controls = window.videoPlayerControls;
    const promises = [];

    if (controls.user && controls.user.play) {
      promises.push(controls.user.play());
    }
    if (controls.professional && controls.professional.play) {
      promises.push(controls.professional.play());
    }

    try {
      await Promise.all(promises);
      console.log('Videos synchronized play');
    } catch (error) {
      console.error('Error during synchronized play:', error);
    }
  }

  // Synchronized pause
  syncPause() {
    if (!this.syncEnabled) return;

    const controls = window.videoPlayerControls;

    if (controls.user && controls.user.pause) {
      controls.user.pause();
    }
    if (controls.professional && controls.professional.pause) {
      controls.professional.pause();
    }

    console.log('Videos synchronized pause');
  }

  // Synchronized seek
  syncSeek(time) {
    if (!this.syncEnabled) return;

    const controls = window.videoPlayerControls;

    if (controls.user && controls.user.seek) {
      controls.user.seek(time);
    }
    if (controls.professional && controls.professional.seek) {
      controls.professional.seek(time);
    }

    console.log(`Videos synchronized seek to ${time}s`);
  }

  // Set synchronized playback rate
  syncPlaybackRate(rate) {
    if (!this.syncEnabled) return;

    const controls = window.videoPlayerControls;

    if (controls.user && controls.user.setPlaybackRate) {
      controls.user.setPlaybackRate(rate);
    }
    if (controls.professional && controls.professional.setPlaybackRate) {
      controls.professional.setPlaybackRate(rate);
    }

    console.log(`Videos synchronized playback rate to ${rate}x`);
  }

  // Get sync status
  getSyncStatus() {
    const controls = window.videoPlayerControls;
    
    if (!controls.user || !controls.professional) {
      return null;
    }

    const userTime = controls.user.getCurrentTime();
    const proTime = controls.professional.getCurrentTime();
    const timeDiff = Math.abs(userTime - proTime);

    return {
      inSync: timeDiff <= this.syncTolerance,
      timeDifference: timeDiff,
      userTime,
      proTime,
      syncTolerance: this.syncTolerance
    };
  }

  // Frame calculation utilities
  calculateFrameNumber(time, frameRate = 30) {
    return Math.floor(time * frameRate);
  }

  calculateTimeFromFrame(frameNumber, frameRate = 30) {
    return frameNumber / frameRate;
  }

  // Step frame forward/backward
  stepFrame(direction = 'forward', frameRate = 30) {
    if (!this.syncEnabled) return;

    const controls = window.videoPlayerControls;
    const frameInterval = 1 / frameRate;
    
    const userTime = controls.user?.getCurrentTime() || 0;
    const newTime = direction === 'forward' 
      ? userTime + frameInterval 
      : Math.max(0, userTime - frameInterval);

    this.syncSeek(newTime);
  }

  // Utility to format time display
  formatTime(seconds) {
    if (!seconds || seconds < 0) return '00:00.000';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const wholeSecs = Math.floor(remainingSeconds);
    const milliseconds = Math.floor((remainingSeconds - wholeSecs) * 1000);

    return `${minutes.toString().padStart(2, '0')}:${wholeSecs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }

  // Check if videos are ready for sync
  areVideosReady() {
    const controls = window.videoPlayerControls;
    return !!(controls.user && controls.professional);
  }

  // Get video durations
  getVideoDurations() {
    const controls = window.videoPlayerControls;
    
    return {
      user: controls.user?.getDuration() || 0,
      professional: controls.professional?.getDuration() || 0
    };
  }

  // Clean up resources
  cleanup() {
    this.disableSync();
    
    // Clean up any object URLs that might be lingering
    // This should be called when the component unmounts
  }
}

// Export singleton instance
export default new VideoService();