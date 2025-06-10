# Testing Guide

## 🧪 Testing Strategy Overview

Our testing approach follows a pyramid structure with comprehensive coverage across all application layers:

```
    /\     E2E Tests (Few)
   /  \    - Complete user workflows
  /____\   - Cross-browser compatibility
 /      \  
/________\  Integration Tests (Some)
           - Component interactions
           - Service integrations
           
Unit Tests (Many)
- Individual functions
- Component logic
- Utility functions
```

---

## 🏗️ Testing Setup

### Test Environment Configuration

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event
npm install --save-dev jest-environment-jsdom
```

### Test File Structure
```
src/
├── components/
│   ├── VideoGrid/
│   │   ├── VideoGrid.jsx
│   │   ├── VideoGrid.test.jsx
│   │   └── VideoGrid.stories.jsx (if using Storybook)
├── services/
│   ├── VideoManager/
│   │   ├── VideoManager.js
│   │   └── VideoManager.test.js
└── utils/
    ├── timeCalculator/
    │   ├── timeCalculator.js
    │   └── timeCalculator.test.js
```

---

## 🔧 Unit Testing

### Utility Functions Testing

#### TimeCalculator Tests
```javascript
// timeCalculator.test.js
describe('TimeCalculator', () => {
  test('converts time to frame number correctly', () => {
    const frameRate = 30;
    const time = 1.0; // 1 second
    const expectedFrame = 30;
    
    expect(TimeCalculator.timeToFrame(time, frameRate)).toBe(expectedFrame);
  });
  
  test('formats time display correctly', () => {
    expect(TimeCalculator.formatTime(65.123)).toBe('01:05.123');
    expect(TimeCalculator.formatTime(3661.456)).toBe('61:01.456');
  });
});
```

#### FrameCalculator Tests
```javascript
// frameCalculator.test.js
describe('FrameCalculator', () => {
  test('calculates frame interval correctly', () => {
    expect(FrameCalculator.getFrameInterval(30)).toBeCloseTo(0.0333, 3);
    expect(FrameCalculator.getFrameInterval(60)).toBeCloseTo(0.0167, 3);
  });
});
```

### Service Testing

#### VideoManager Tests
```javascript
// VideoManager.test.js
describe('VideoManager', () => {
  test('validates video file correctly', () => {
    const validFile = new File([''], 'test.mp4', { type: 'video/mp4' });
    const invalidFile = new File([''], 'test.txt', { type: 'text/plain' });
    
    expect(VideoManager.validateVideo(validFile).isValid).toBe(true);
    expect(VideoManager.validateVideo(invalidFile).isValid).toBe(false);
  });
  
  test('extracts metadata from video element', async () => {
    const mockVideo = createMockVideoElement();
    const metadata = VideoManager.getMetadata(mockVideo);
    
    expect(metadata).toHaveProperty('duration');
    expect(metadata).toHaveProperty('frameRate');
  });
});
```

---

## 🧩 Component Testing

### React Component Tests

#### VideoGrid Component Tests
```javascript
// VideoGrid.test.jsx
import { render, screen } from '@testing-library/react';
import { VideoGrid } from './VideoGrid';

describe('VideoGrid', () => {
  test('renders dual video containers', () => {
    render(<VideoGrid userVideo={null} professionalVideo={null} />);
    
    expect(screen.getByTestId('user-video-container')).toBeInTheDocument();
    expect(screen.getByTestId('pro-video-container')).toBeInTheDocument();
  });
  
  test('displays upload prompts when no videos loaded', () => {
    render(<VideoGrid userVideo={null} professionalVideo={null} />);
    
    expect(screen.getByText(/upload your serve/i)).toBeInTheDocument();
    expect(screen.getByText(/select professional/i)).toBeInTheDocument();
  });
});
```

#### PlaybackControls Component Tests
```javascript
// PlaybackControls.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PlaybackControls } from './PlaybackControls';

describe('PlaybackControls', () => {
  test('calls onPlay when play button clicked', () => {
    const mockOnPlay = jest.fn();
    render(<PlaybackControls isPlaying={false} onPlay={mockOnPlay} />);
    
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(mockOnPlay).toHaveBeenCalledTimes(1);
  });
  
  test('displays correct playback state', () => {
    const { rerender } = render(<PlaybackControls isPlaying={false} />);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    
    rerender(<PlaybackControls isPlaying={true} />);
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });
});
```

---

## 🔗 Integration Testing

### Component Integration Tests

#### Video Synchronization Tests
```javascript
// videoSync.integration.test.jsx
describe('Video Synchronization Integration', () => {
  test('synchronizes video playback correctly', async () => {
    const { userVideo, proVideo } = setupMockVideos();
    render(<App />);
    
    // Upload videos
    await uploadTestVideo('user-upload', userVideo);
    await uploadTestVideo('pro-upload', proVideo);
    
    // Start synchronized playback
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    
    // Verify both videos are playing
    await waitFor(() => {
      expect(screen.getByTestId('user-video')).toHaveProperty('paused', false);
      expect(screen.getByTestId('pro-video')).toHaveProperty('paused', false);
    });
  });
});
```

### Service Integration Tests

#### File Upload Integration
```javascript
// fileUpload.integration.test.js
describe('File Upload Integration', () => {
  test('complete file upload workflow', async () => {
    const file = createMockVideoFile();
    const fileHandler = new FileHandler();
    const videoManager = new VideoManager();
    
    // Upload and validate file
    const uploadResult = await fileHandler.uploadFile(file);
    expect(uploadResult.success).toBe(true);
    
    // Load video data
    const videoData = await videoManager.loadVideo(file);
    expect(videoData.metadata).toBeDefined();
  });
});
```

---

## 🌐 End-to-End Testing

### User Workflow Tests

#### Complete Serve Comparison Workflow
```javascript
// serveComparison.e2e.test.js
describe('Serve Comparison E2E', () => {
  test('complete serve comparison workflow', async () => {
    // 1. Load application
    