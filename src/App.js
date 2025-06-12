import React, { useState } from 'react';
import './styles/globals.css';
import './styles/variables.css';
import logger from './utils/logger'; 

function App() {
  const [userVideo, setUserVideo] = useState(null);
  const [proVideo, setProVideo] = useState(null);
  const [syncMode, setSyncMode] = useState('independent');
  const handleFileUpload = (file, type) => {
    // Validation Checks
    // Validate video file type (.mp4, .mov, .avi)
    if (!file || !file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 50MB');
      return;
    }

    const videoData = {
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      type: file.type
    };

    if (type === 'user') {
      setUserVideo(videoData);
    } else {
      setProVideo(videoData);
    }
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0], type);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const removeVideo = (type) => {
    if (type === 'user') {
      if (userVideo) URL.revokeObjectURL(userVideo.url);
      setUserVideo(null);
    } else {
      if (proVideo) URL.revokeObjectURL(proVideo.url);
      setProVideo(null);
    }
  };

  const toggleSyncMode = () => {
    setSyncMode(syncMode === 'independent' ? 'synchronized' : 'independent');
  };

  const VideoSection = ({ title, video, type }) => (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: 'var(--border-radius)',
      padding: 'var(--spacing-lg)',
      boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
      height: '400px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h2 style={{
        marginBottom: 'var(--spacing-md)',
        color: 'var(--text-primary)',
        fontSize: '1.25rem',
        textAlign: 'center'
      }}>
        {title}
      </h2>
      
      {video ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ 
            flex: 1, 
            backgroundColor: 'var(--video-bg)',
            borderRadius: 'var(--border-radius)',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <video 
              src={video.url} 
              controls={syncMode === 'independent'}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain'
              }}
            />
            {syncMode === 'synchronized' && (
              <div style={{
                position: 'absolute',
                top: 'var(--spacing-sm)',
                right: 'var(--spacing-sm)',
                backgroundColor: 'var(--control-bg)',
                color: 'white',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                borderRadius: 'calc(var(--border-radius) / 2)',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)'
              }}>
                <span>🔗</span>
                <span>Synchronized</span>
              </div>
            )}
          </div>
          
          <div style={{ 
            marginTop: 'var(--spacing-sm)',
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ 
                fontSize: '0.875rem', 
                color: 'var(--text-primary)',
                margin: 0,
                fontWeight: 500
              }}>
                {video.name}
              </p>
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-secondary)',
                margin: 0
              }}>
                {(video.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button 
              onClick={() => removeVideo(type)}
              style={{
                backgroundColor: 'var(--error-color)',
                color: 'white',
                border: 'none',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                borderRadius: 'calc(var(--border-radius) / 2)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div 
          style={{
            flex: 1,
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--border-radius)',
            padding: 'var(--spacing-xl)',
            textAlign: 'center',
            backgroundColor: 'var(--bg-accent)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onDrop={(e) => handleDrop(e, type)}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById(`fileInput-${type}`).click()}
          onMouseEnter={(e) => {
            e.target.style.borderColor = 'var(--primary-color)';
            e.target.style.backgroundColor = 'var(--bg-secondary)';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = 'var(--border-color)';
            e.target.style.backgroundColor = 'var(--bg-accent)';
          }}
        >
          <div>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)', opacity: 0.7 }}>
              📹
            </div>
            <h3 style={{ 
              color: 'var(--text-primary)', 
              marginBottom: 'var(--spacing-sm)',
              fontSize: '1.25rem'
            }}>
              Drop {type} video here
            </h3>
            <p style={{ 
              color: 'var(--text-secondary)', 
              marginBottom: 'var(--spacing-md)',
              fontSize: '1rem'
            }}>
              or click to browse files
            </p>
            <span style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              fontStyle: 'italic'
            }}>
              Supports: MP4, MOV, AVI (max 50MB)
            </span>
          </div>
          <input 
            id={`fileInput-${type}`}
            type="file" 
            accept="video/*"
            onChange={(e) => handleFileUpload(e.target.files[0], type)}
            style={{ display: 'none' }}
          />
        </div>
      )}
    </div>
  );

  const bothVideosLoaded = userVideo && proVideo;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))',
        color: 'white',
        padding: 'var(--spacing-lg) var(--spacing-md)',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          marginBottom: 'var(--spacing-sm)',
          fontWeight: 600
        }}>
          Tennis Serve Comparison
        </h1>
        <p style={{ opacity: 0.9, fontSize: '1.125rem' }}>
          Analyze and compare tennis serves frame by frame
        </p>
      </header>

      <main style={{
        flex: 1,
        padding: 'var(--spacing-lg)',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-xl)'
        }}>
          <VideoSection title="Your Serve" video={userVideo} type="user" />
          <VideoSection title="Professional Serve" video={proVideo} type="pro" />
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--border-radius)',
          padding: 'var(--spacing-lg)',
          boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            marginBottom: 'var(--spacing-lg)',
            color: 'var(--text-primary)',
            fontSize: '1.25rem'
          }}>
            Video Controls
          </h3>

          {bothVideosLoaded && (
            <div style={{
              marginBottom: 'var(--spacing-lg)',
              padding: 'var(--spacing-lg)',
              backgroundColor: 'var(--bg-accent)',
              borderRadius: 'var(--border-radius)',
              border: '1px solid var(--border-color)'
            }}>
              <button 
                onClick={toggleSyncMode}
                style={{
                  backgroundColor: syncMode === 'synchronized' ? 'var(--success-color)' : 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  padding: 'var(--spacing-md) var(--spacing-lg)',
                  borderRadius: 'var(--border-radius)',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginBottom: 'var(--spacing-sm)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                {syncMode === 'synchronized' ? '🔗 Synchronized' : '🔓 Independent'}
              </button>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                margin: 0
              }}>
                {syncMode === 'synchronized' 
                  ? 'Videos will play together in sync' 
                  : 'Videos play independently'
                }
              </p>
            </div>
          )}

          <div style={{
            padding: 'var(--spacing-md)',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--border-radius)',
            border: '1px solid var(--border-color)'
          }}>
            {userVideo && (
              <p style={{ 
                margin: 'var(--spacing-xs) 0',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem'
              }}>
                ✅ User video: {userVideo.name}
              </p>
            )}
            {proVideo && (
              <p style={{ 
                margin: 'var(--spacing-xs) 0',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem'
              }}>
                ✅ Professional video: {proVideo.name}
              </p>
            )}
            {!bothVideosLoaded && (
              <p style={{ 
                margin: 'var(--spacing-xs) 0',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem'
              }}>
                Upload both videos to enable comparison features
              </p>
            )}
            {bothVideosLoaded && (
              <p style={{ 
                margin: 'var(--spacing-xs) 0',
                color: 'var(--success-color)',
                fontSize: '0.875rem',
                fontWeight: 'bold'
              }}>
                🎉 Ready for comparison!
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;