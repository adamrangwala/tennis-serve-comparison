# API Reference

## 📋 Component APIs

### Core Components

#### VideoGrid Component
*Container for dual video display*

```typescript
interface VideoGridProps {
  userVideo: VideoFile | null;
  professionalVideo: VideoFile | null;
  layout: 'side-by-side' | 'stacked' | 'overlay';
  onVideoSwap: () => void;
}
```

**Usage:**
```jsx
<VideoGrid 
  userVideo={userVideo}
  professionalVideo={proVideo}
  layout="side-by-side"
  onVideoSwap={handleVideoSwap}
/>
```

---

#### PlaybackControls Component
*Unified video playback controls*

```typescript
interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  syncMode: 'synchronized' | 'independent';
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
  onSyncModeChange: (mode: string) => void;
}
```

---

#### UploadControls Component
*File upload interface*

```typescript
interface UploadControlsProps {
  onFileUpload: (file: File, type: 'user' | 'professional') => void;
  acceptedFormats: string[];
  maxFileSize: number;
  isUploading: boolean;
}
```

---

## 🔧 Service APIs

### VideoManager Service

#### Core Methods
```typescript
class VideoManager {
  // Load video from file
  loadVideo(file: File): Promise<VideoData>;
  
  // Extract video metadata
  getMetadata(video: HTMLVideoElement): VideoMetadata;
  
  // Validate video file
  validateVideo(file: File): ValidationResult;
  
  // Get video thumbnail
  generateThumbnail(video: HTMLVideoElement, time: number): string;
}
```

#### Types
```typescript
interface VideoData {
  file: File;
  url: string;
  metadata: VideoMetadata;
  thumbnail: string;
}

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  frameRate: number;
  format: string;
  size: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

---

### SyncEngine Service

#### Synchronization Methods
```typescript
class SyncEngine {
  // Synchronize video playback
  syncPlayback(video1: HTMLVideoElement, video2: HTMLVideoElement): void;
  
  // Seek both videos to specific time
  syncSeek(time: number): void;
  
  // Step frame by frame
  stepFrame(direction: 'forward' | 'backward'): void;
  
  // Calculate time offset between videos
  calculateOffset(video1: VideoData, video2: VideoData): number;
}
```

---

### FileHandler Service

#### File Operations
```typescript
class FileHandler {
  // Handle file upload with validation
  uploadFile(file: File): Promise<FileUploadResult>;
  
  // Validate file type and size
  validateFile(file: File): ValidationResult;
  
  // Generate file preview
  generatePreview(file: File): Promise<string>;
  
  // Convert file to object URL
  createObjectURL(file: File): string;
}

interface FileUploadResult {
  success: boolean;
  fileData: VideoData | null;
  error?: string;
}
```

---

## 🧮 Utility APIs

### TimeCalculator Utilities

```typescript
class TimeCalculator {
  // Convert time to frame number
  timeToFrame(time: number, frameRate: number): number;
  
  // Convert frame number to time
  frameToTime(frame: number, frameRate: number): number;
  
  // Format time for display
  formatTime(seconds: number): string; // Returns "MM:SS.fff"
  
  // Calculate sync offset
  calculateSyncOffset(trim1: TrimPoints, trim2: TrimPoints): number;
}

interface TrimPoints {
  start: number;
  end: number;
}
```

---

### FrameCalculator Utilities

```typescript
class FrameCalculator {
  // Get video frame rate
  getFrameRate(video: HTMLVideoElement): number;
  
  // Calculate frame interval
  getFrameInterval(frameRate: number): number;
  
  // Get current frame number
  getCurrentFrame(video: HTMLVideoElement): number;
  
  // Step to specific frame
  seekToFrame(video: HTMLVideoElement, frameNumber: number): void;
}
```

---

## 📊 State Management API

### App State Schema

```typescript
interface AppState {
  videos: {
    user: VideoState | null;
    professional: VideoState | null;
  };
  playback: PlaybackState;
  ui: UIState;
  settings: UserSettings;
}

interface VideoState {
  file: File;
  metadata: VideoMetadata;
  trimPoints: TrimPoints;
  isLoaded: boolean;
  error?: string;
}

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  speed: number;
  syncMode: 'synchronized' | 'independent';
  activeVideo: 'user' | 'professional' | 'both';
}

interface UIState {
  layout: 'side-by-side' | 'stacked';
  showControls: boolean;
  activePanel: 'upload' | 'playback' | 'frame' | 'trim';
  isLoading: boolean;
}

interface UserSettings {
  defaultSpeed: number;
  autoPlay: boolean;
  theme: 'light' | 'dark';
  shortcuts: KeyboardShortcuts;
}
```

---

### State Actions

```typescript
// Video Actions
const VideoActions = {
  LOAD_VIDEO: 'LOAD_VIDEO',
  SET_VIDEO_METADATA: 'SET_VIDEO_METADATA',
  SET_TRIM_POINTS: 'SET_TRIM_POINTS',
  SWAP_VIDEOS: 'SWAP_VIDEOS',
  CLEAR_VIDEO: 'CLEAR_VIDEO'
} as const;

// Playback Actions
const PlaybackActions = {
  PLAY: 'PLAY',
  PAUSE: 'PAUSE',
  SEEK: 'SEEK',
  SET_SPEED: 'SET_SPEED',
  SET_SYNC_MODE: 'SET_SYNC_MODE',
  STEP_FRAME: 'STEP_FRAME'
} as const;
```

---

## 🎹 Keyboard Shortcuts API

### Default Shortcuts
```typescript
interface KeyboardShortcuts {
  play: string;          // Default: 'Space'
  stepForward: string;   // Default: 'ArrowRight'
  stepBackward: string;  // Default: 'ArrowLeft'
  speedUp: string;       // Default: 'ArrowUp'
  speedDown: string;     // Default: 'ArrowDown'
  toggleSync: string;    // Default: 'KeyS'
  swapVideos: string;    // Default: 'KeyW'
}
```

---

## 🚨 Error Handling API

### Error Types
```typescript
enum ErrorType {
  FILE_INVALID = 'FILE_INVALID',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  VIDEO_LOAD_FAILED = 'VIDEO_LOAD_FAILED',
  SYNC_FAILED = 'SYNC_FAILED',
  METADATA_EXTRACTION_FAILED = 'METADATA_EXTRACTION_FAILED'
}

interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
}
```

### Error Handler
```typescript
class ErrorHandler {
  static handleError(error: AppError): void;
  static formatUserMessage(error: AppError): string;
  static logError(error: AppError): void;
}
```

---

## 📝 Event System API

### Custom Events
```typescript
// Video events
const VideoEvents = {
  VIDEO_LOADED: 'video:loaded',
  VIDEO_ERROR: 'video:error',
  METADATA_EXTRACTED: 'video:metadata',
  THUMBNAIL_GENERATED: 'video:thumbnail'
} as const;

// Playback events
const PlaybackEvents = {
  PLAY_STATE_CHANGED: 'playback:play-state-changed',
  TIME_UPDATED: 'playback:time-updated',
  SYNC_STATE_CHANGED: 'playback:sync-state-changed'
} as const;
```

---

*This API reference will be updated as components and services are implemented.*