import React, { useRef, useEffect, useState } from 'react';
import { QrCode, Square } from 'lucide-react';
import { Language, Song } from '../types';
import { translations } from '../data/translations';
import jsQR from 'jsqr';

interface QRScannerProps {
  currentLanguage: Language;
  songs: Song[];
  onSongFound: (song: Song) => void;
  onNoMatch: (scannedData: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  currentLanguage,
  songs,
  onSongFound,
  onNoMatch
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async () => {
    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready before starting scanning
        videoRef.current.onloadedmetadata = () => {
          setIsScanning(true);
          startQRScanning();
        };
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
    setCameraError('');
  };

  const startQRScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            handleQRCodeDetected(code.data);
          }
        }
      }
    }, 100);
  };

  const handleQRCodeDetected = (data: string) => {
    stopCamera();
    
    // Find matching song
    const matchedSong = songs.find(song => {
      const hitsterUrl = song.hitster_url.toLowerCase();
      const scannedUrl = data.toLowerCase();
      return hitsterUrl === scannedUrl || hitsterUrl.includes(scannedUrl) || scannedUrl.includes(hitsterUrl);
    });

    if (matchedSong) {
      onSongFound(matchedSong);
    } else {
      onNoMatch(data);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="qr-scanner-section">
      <div className="scanner-header">
        <h3 className="scanner-title">
          <QrCode size={24} />
          {isScanning 
            ? translations.scanQrCode?.[currentLanguage] || 'Scan QR Code'
            : translations.readyToScan?.[currentLanguage] || 'Ready to Scan'
          }
        </h3>
        <p className="scanner-subtitle">
          {isScanning 
            ? translations.scanInstruction?.[currentLanguage] || 'Point your camera at a HITSTER QR code'
            : translations.clickToStartScanning?.[currentLanguage] || 'Click the button below to start scanning HITSTER QR codes'
          }
        </p>
      </div>

      {isScanning ? (
        <div className="scanner-container">
          <video
            ref={videoRef}
            className="scanner-video"
            autoPlay
            playsInline
            muted
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="scanner-overlay">
            <div className="scanner-frame" />
            <p className="scanner-hint">
              {translations.scanHint?.[currentLanguage] || 'Position QR code within the frame'}
            </p>
          </div>
        </div>
      ) : (
        <div className="scanner-placeholder">
          <div className="scanner-placeholder-content">
            <QrCode size={64} />
            <p>{translations.readyToScan?.[currentLanguage] || 'Ready to Scan'}</p>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="scanner-error">
          <p>{cameraError}</p>
          <button className="primary-button" onClick={() => setCameraError('')}>
            {translations.retry?.[currentLanguage] || 'Retry'}
          </button>
        </div>
      )}

      <div className="scanner-controls">
        {isScanning ? (
          <button className="secondary-button" onClick={stopCamera}>
            <Square size={16} />
            <span>{translations.stopScanning?.[currentLanguage] || 'Stop Scanning'}</span>
          </button>
        ) : (
          <button className="primary-button" onClick={startCamera}>
            <QrCode size={16} />
            <span>{translations.startScanning?.[currentLanguage] || 'Start Scanning'}</span>
          </button>
        )}
      </div>
    </div>
  );
};