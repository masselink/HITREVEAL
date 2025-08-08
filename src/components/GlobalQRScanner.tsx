import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Square, List, X } from 'lucide-react';
import { Language, Song } from '../types';
import { translations } from '../data/translations';
import { useLanguage } from '../hooks/useLanguage';

interface QRScannerProps {
  onSongScanned: (song: Song) => void;
  onClose: () => void;
  usedSongs: Song[];
}

export const GlobalQRScanner: React.FC<QRScannerProps> = ({ onSongScanned, onClose, usedSongs }) => {
  const { currentLanguage } = useLanguage();
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (scanMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [scanMode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      setError(translations.cameraError[currentLanguage]);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const songData = JSON.parse(manualInput);
      
      if (!songData.title || !songData.artist || !songData.year || !songData.videoId) {
        throw new Error('Invalid song data format');
      }

      const song: Song = {
        title: songData.title,
        artist: songData.artist,
        year: parseInt(songData.year),
        videoId: songData.videoId
      };

      const isUsed = usedSongs.some(usedSong => 
        usedSong.videoId === song.videoId
      );

      if (isUsed) {
        setError(translations.songAlreadyUsed[currentLanguage]);
        setIsProcessing(false);
        return;
      }

      onSongScanned(song);
    } catch (err) {
      setError(translations.invalidQRCode[currentLanguage]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="qr-scanner-overlay">
      <div className="qr-scanner-container">
        <div className="qr-scanner-header">
          <h3>{translations.scanQRCode[currentLanguage]}</h3>
          <button onClick={onClose} className="close-button">
            <X size={24} />
          </button>
        </div>

        <div className="scan-mode-toggle">
          <button
            className={scanMode === 'camera' ? 'active' : ''}
            onClick={() => setScanMode('camera')}
          >
            <QrCode size={20} />
            {translations.camera[currentLanguage]}
          </button>
          <button
            className={scanMode === 'manual' ? 'active' : ''}
            onClick={() => setScanMode('manual')}
          >
            <List size={20} />
            {translations.manual[currentLanguage]}
          </button>
        </div>

        {scanMode === 'camera' ? (
          <div className="camera-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="scan-overlay">
              <div className="scan-frame">
                <Square size={200} className="scan-square" />
              </div>
            </div>
          </div>
        ) : (
          <div className="manual-input-container">
            <form onSubmit={handleManualSubmit}>
              <textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={translations.pasteQRData[currentLanguage]}
                className="manual-input"
                rows={6}
              />
              <button
                type="submit"
                disabled={isProcessing || !manualInput.trim()}
                className="submit-button"
              >
                {isProcessing ? translations.processing[currentLanguage] : translations.submit[currentLanguage]}
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};