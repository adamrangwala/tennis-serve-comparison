// File: src/components/VideoPlayer/DiagnosticVideoPlayer.jsx
// A simple diagnostic player to test video loading

import React, { useRef, useEffect, useState } from 'react';
import styles from './VideoPlayer.module.css';

const DiagnosticVideoPlayer = ({ 
  videoData, 
  videoType = 'user',
  onLoadedData
}) => {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('No video');
  const [videoInfo, setVideoInfo] = useState({});
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(`[${videoType}] ${message}`);
  };

  useEffect(() => {
    if (!videoData) {
      setStatus('No video data');
      setLogs([]);
      return;
    }

    const video = videoRef.current;
    if (!video) {
      addLog('No video element ref');
      return;
    }

    // Prevent multiple initializations for the same video
    if (video.src === videoData.url && video.readyState >= 1) {
      addLog('Video already loaded with this URL, skipping re-initialization');
      setStatus('Video already loaded');
      return;
    }

    addLog(`Starting video load: ${videoData.name}`);
    addLog(`Blob URL: ${videoData.url}`);
    addLog(`File size: ${(videoData.size / 1024 / 1024).toFixed(2)}MB`);
    addLog(`File type: ${videoData.type}`);

    setStatus('Setting up video element...');

    // Set basic video properties
    video.preload = 'metadata';
    video.playsInline = true;
    video.controls = true;
    video.muted = true; // Some browsers require muted for autoplay
    
    // Comprehensive event listeners
    const events = [
      'loadstart', 'durationchange', 'loadedmetadata', 'loadeddata',
      'progress', 'canplay', 'canplaythrough', 'seeking', 'seeked',
      'ended', 'emptied', 'stalled', 'suspend', 'waiting', 'error'
    ];

    const eventHandlers = {};

    events.forEach(eventName => {
      eventHandlers[eventName] = (e) => {
        addLog(`Event: ${eventName}`);
        
        if (eventName === 'loadedmetadata') {
          setVideoInfo({
            duration: video.duration,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            readyState: video.readyState
          });
          setStatus('Metadata loaded');
        }
        
        if (eventName === 'loadeddata') {
          setStatus('Video data loaded - Ready!');
          if (onLoadedData) {
            onLoadedData({
              duration: video.duration,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight
            });
          }
        }
        
        if (eventName === 'canplay') {
          setStatus('Can play');
        }
        
        if (eventName === 'error') {
          const error = video.error;
          addLog(`VIDEO ERROR: Code ${error?.code}, Message: ${error?.message}`);
          addLog(`Network State: ${video.networkState}, Ready State: ${video.readyState}`);
          setStatus(`Error: ${error?.message || 'Unknown error'}`);
        }
        
        if (eventName === 'stalled') {
          addLog('Video stalled - checking network state');
          addLog(`Network State: ${video.networkState}`);
        }
      };
      
      video.addEventListener(eventName, eventHandlers[eventName]);
    });

    // Set the source and load
    addLog('Setting video.src...');
    video.src = videoData.url;
    
    addLog('Calling video.load()...');
    video.load();

    // Test timeout
    const timeout = setTimeout(() => {
      if (video.readyState < 2) { // HAVE_CURRENT_DATA
        addLog('TIMEOUT: Video did not load within 15 seconds');
        setStatus('Timeout - video did not load');
      }
    }, 15000);

    // Cleanup
    return () => {
      clearTimeout(timeout);
      events.forEach(eventName => {
        if (eventHandlers[eventName]) {
          video.removeEventListener(eventName, eventHandlers[eventName]);
        }
      });
    };
  }, [videoData?.url, videoType]); // Only re-run when URL changes

  if (!videoData) {
    return (
      <div className={styles.videoPlayerContainer}>
        <div className={styles.noVideoState}>
          <div className={styles.noVideoIcon}>🎬</div>
          <p>No video uploaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.videoPlayerContainer}>
      <div style={{ padding: '16px', backgroundColor: '#f8f9fa' }}>
        <h4>Video Diagnostic - {videoType}</h4>
        <p><strong>Status:</strong> {status}</p>
        
        {Object.keys(videoInfo).length > 0 && (
          <div>
            <strong>Video Info:</strong>
            <ul>
              <li>Duration: {videoInfo.duration?.toFixed(2)}s</li>
              <li>Dimensions: {videoInfo.videoWidth}×{videoInfo.videoHeight}</li>
              <li>Ready State: {videoInfo.readyState}</li>
            </ul>
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <strong>Test Controls:</strong>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button onClick={() => {
              const video = videoRef.current;
              if (video) {
                addLog(`Manual load() called - readyState: ${video.readyState}`);
                video.load();
              }
            }}>
              Reload Video
            </button>
            <button onClick={() => {
              const video = videoRef.current;
              if (video) {
                addLog(`Play attempt - readyState: ${video.readyState}`);
                video.play().catch(e => addLog(`Play failed: ${e.message}`));
              }
            }}>
              Try Play
            </button>
            <button onClick={() => {
              addLog('Manual blob URL test');
              const testImg = new Image();
              testImg.onload = () => addLog('Blob URL is accessible');
              testImg.onerror = () => addLog('Blob URL is NOT accessible');
              testImg.src = videoData.url;
            }}>
              Test Blob URL
            </button>
          </div>
        </div>
      </div>

      <div className={styles.videoContainer}>
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '300px',
            backgroundColor: '#000'
          }}
        />
      </div>

      <div style={{ 
        padding: '16px', 
        backgroundColor: '#f1f1f1',
        maxHeight: '200px',
        overflow: 'auto',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <strong>Event Log:</strong>
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </div>

      <div className={styles.videoMetadata}>
        <span className={styles.videoName}>{videoData.name}</span>
        <span className={styles.videoSize}>
          {(videoData.size / (1024 * 1024)).toFixed(2)} MB
        </span>
      </div>
    </div>
  );
};

export default DiagnosticVideoPlayer;