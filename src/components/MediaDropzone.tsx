import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Trash2,
  MapPin,
  Camera,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import type { EvidenceItem, ExifData, LocationState } from '../types';
import { extractExifFromImage, formatBytes } from '../utils/exifHelper';

interface MediaDropzoneProps {
  evidenceList: EvidenceItem[];
  onAddEvidence: (items: EvidenceItem[]) => void;
  onRemoveEvidence: (id: string) => void;
  onExifLocationFound: (location: LocationState) => void;
}

export const MediaDropzone: React.FC<MediaDropzoneProps> = ({
  evidenceList,
  onAddEvidence,
  onRemoveEvidence,
  onExifLocationFound,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeExifModal, setActiveExifModal] = useState<ExifData | null>(null);

  // Process selected files
  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);

    const newItems: EvidenceItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mime = file.type || '';
      let mediaType: 'image' | 'video' | 'audio' = 'image';

      if (mime.startsWith('video/')) mediaType = 'video';
      else if (mime.startsWith('audio/')) mediaType = 'audio';

      const previewUrl = URL.createObjectURL(file);
      let exif: ExifData | null = null;

      if (mediaType === 'image') {
        exif = await extractExifFromImage(file);
        // If EXIF contains GPS coordinates, notify parent with highest priority
        if (exif && exif.latitude !== undefined && exif.longitude !== undefined) {
          onExifLocationFound({
            latitude: exif.latitude,
            longitude: exif.longitude,
            source: 'exif',
            accuracy: 10,
            address: `Location from Photo EXIF (${exif.latitude.toFixed(4)}, ${exif.longitude.toFixed(4)})`,
          });
        }
      }

      newItems.push({
        id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl,
        mediaType,
        originalName: file.name,
        fileSize: file.size,
        exif,
      });
    }

    onAddEvidence(newItems);
    setIsProcessing(false);
  };

  // Load pre-bundled sample geotagged images for instant testing
  const loadSampleGeotaggedImage = async (sampleName: string, label: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/samples/${sampleName}`);
      const blob = await res.blob();
      const file = new File([blob], `${label.toLowerCase().replace(/\s+/g, '_')}.jpg`, { type: 'image/jpeg' });
      await processFiles([file]);
    } catch (err) {
      console.error('Failed to load sample image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  return (
    <div>
      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/jpg,video/mp4,video/webm,video/quicktime,audio/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) processFiles(e.target.files);
        }}
      />

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: isDragging ? '2px dashed var(--accent-amber)' : '1px dashed var(--border-medium)',
          backgroundColor: isDragging ? 'var(--accent-amber-glow)' : 'var(--bg-input)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            color: isDragging ? 'var(--accent-amber)' : 'var(--text-secondary)',
          }}
        >
          <UploadCloud size={24} />
        </div>

        <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.35rem' }}>
          {isProcessing ? 'Inspecting Media & EXIF Data...' : 'Drop photos or videos here, or browse'}
        </div>

        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto' }}>
          Supports JPEG, PNG, WEBP, MP4, MOV. Geotagged images will automatically pinpoint the incident on the map.
        </p>
      </div>

      {/* Quick Geotagged Samples Helper */}
      <div
        style={{
          marginTop: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}
        >
          <Sparkles size={13} color="var(--accent-amber)" /> Test Samples:
        </span>

        <button
          type="button"
          onClick={() => loadSampleGeotaggedImage('flooded_road_mumbai.jpg', 'Flooded Road Mumbai')}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
        >
          <MapPin size={12} color="var(--accent-amber)" /> Flooded Road (Mumbai GPS)
        </button>

        <button
          type="button"
          onClick={() => loadSampleGeotaggedImage('overflowing_drain_sf.jpg', 'Overflow Drain SF')}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
        >
          <MapPin size={12} color="var(--accent-amber)" /> Overflowing Drain (SF GPS)
        </button>

        <button
          type="button"
          onClick={() => loadSampleGeotaggedImage('broken_infrastructure_london.jpg', 'Broken Streetlight London')}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
        >
          <MapPin size={12} color="var(--accent-amber)" /> Streetlight (London GPS)
        </button>
      </div>

      {/* Uploaded Evidence Grid */}
      {evidenceList.length > 0 && (
        <div style={{ marginTop: '1.25rem' }}>
          <div
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={14} /> Attached Evidence ({evidenceList.length})
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.85rem',
            }}
          >
            {evidenceList.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Media Preview Frame */}
                <div
                  style={{
                    height: '120px',
                    backgroundColor: 'var(--bg-input)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {item.mediaType === 'image' && (
                    <img
                      src={item.previewUrl}
                      alt={item.originalName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}

                  {item.mediaType === 'video' && (
                    <video
                      src={item.previewUrl}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      controls={false}
                    />
                  )}

                  {item.mediaType === 'audio' && (
                    <div style={{ color: 'var(--accent-amber)', textAlign: 'center' }}>
                      <Camera size={28} />
                      <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Audio Note</div>
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveEvidence(item.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Remove evidence"
                  >
                    <Trash2 size={13} />
                  </button>

                  {/* EXIF GPS Chip Badge */}
                  {item.exif?.latitude && item.exif?.longitude && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '6px',
                        left: '6px',
                        backgroundColor: 'rgba(16, 185, 129, 0.9)',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      <MapPin size={10} /> EXIF GPS
                    </div>
                  )}
                </div>

                {/* Info Bar */}
                <div
                  style={{
                    padding: '0.65rem',
                    fontSize: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={item.originalName}
                  >
                    {item.originalName}
                  </div>

                  <div
                    className="mono"
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{formatBytes(item.fileSize)}</span>
                    {item.exif && (
                      <button
                        type="button"
                        onClick={() => setActiveExifModal(item.exif!)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-amber)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          fontSize: '0.7rem',
                        }}
                      >
                        <Info size={11} /> EXIF
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXIF Metadata Modal Viewer */}
      {activeExifModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setActiveExifModal(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: '420px',
              width: '100%',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-medium)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '0.75rem',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Camera size={16} color="var(--accent-amber)" /> Extracted EXIF Metadata
              </div>
              <button
                type="button"
                onClick={() => setActiveExifModal(null)}
                className="btn btn-ghost btn-sm"
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Camera:</span>
                <span className="mono">{activeExifModal.make || 'Unknown'} {activeExifModal.model || ''}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Capture Time:</span>
                <span className="mono">{activeExifModal.dateTimeOriginal ? new Date(activeExifModal.dateTimeOriginal).toLocaleString() : 'N/A'}</span>
              </div>
              {activeExifModal.latitude !== undefined && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>GPS Coordinates:</span>
                    <span className="mono" style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                      {activeExifModal.latitude.toFixed(5)}, {activeExifModal.longitude?.toFixed(5)}
                    </span>
                  </div>
                  {activeExifModal.altitude && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Altitude:</span>
                      <span className="mono">{activeExifModal.altitude} m</span>
                    </div>
                  )}
                </>
              )}
              {activeExifModal.iso && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>ISO / Exposure:</span>
                  <span className="mono">ISO {activeExifModal.iso} / {activeExifModal.exposureTime || ''}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveExifModal(null)}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', marginTop: '1.25rem' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
