import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Volume2, Sparkles, Upload } from 'lucide-react';
import type { EvidenceItem } from '../types';

interface AudioRecorderProps {
  onAudioReady: (item: EvidenceItem, transcript?: string) => void;
  existingAudio?: EvidenceItem | null;
  onRemoveAudio?: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioReady,
  existingAudio,
  onRemoveAudio,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudio?.previewUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync with existing audio if provided
  useEffect(() => {
    if (existingAudio) {
      setAudioUrl(existingAudio.previewUrl);
    }
  }, [existingAudio]);

  // Audio Playback Listener
  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  // Draw Soundwave on Canvas
  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / 32);
    let x = 0;

    for (let i = 0; i < 32; i++) {
      const barHeight = (dataArray[i * 2] / 255) * (canvas.height * 0.85);
      
      // Amber tone visualizer
      ctx.fillStyle = isRecording ? '#f59e0b' : '#64748b';
      ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 2, Math.max(3, barHeight));

      x += barWidth;
    }

    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  };

  // Start Live Microphone Recording
  const startRecording = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Web Audio Analyser
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      analyser.fftSize = 64;
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        const file = new File([audioBlob], `voice_report_${Date.now()}.webm`, { type: 'audio/webm' });
        const item: EvidenceItem = {
          id: `aud_${Date.now()}`,
          file,
          previewUrl: url,
          mediaType: 'audio',
          originalName: file.name,
          fileSize: audioBlob.size,
          durationSeconds: recordingTime,
        };

        onAudioReady(item, transcript);

        // Stop media tracks
        stream.getTracks().forEach((track) => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };

      // Start Web Speech API Speech-to-Text if supported
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript + ' ';
            }
            setTranscript(fullText.trim());
          };

          recognition.onerror = (e: any) => {
            console.warn('Speech recognition notice:', e);
          };

          recognition.start();
          recognitionRef.current = recognition;
          setIsTranscribing(true);
        } catch (e) {
          console.warn('Speech recognition not available:', e);
        }
      }

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      drawWaveform();
    } catch (err: any) {
      console.error('Microphone error:', err);
      setErrorMsg('Microphone access was denied or not supported by browser. You can still upload an audio file below.');
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsTranscribing(false);

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    }
  };

  // Play / Pause Audio
  const togglePlay = () => {
    if (!audioElementRef.current) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  // Reset Audio
  const handleReset = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingTime(0);
    setTranscript('');
    if (onRemoveAudio) onRemoveAudio();
  };

  // Handle Manual Audio File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setAudioUrl(url);

    const item: EvidenceItem = {
      id: `aud_${Date.now()}`,
      file,
      previewUrl: url,
      mediaType: 'audio',
      originalName: file.name,
      fileSize: file.size,
    };

    onAudioReady(item, transcript);
  };

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-input)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        marginTop: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Volume2 size={16} color="var(--accent-amber)" />
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Voice Note / Audio Evidence</span>
        </div>
        {isTranscribing && (
          <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
            <Sparkles size={12} /> Live Transcribing
          </span>
        )}
      </div>

      {errorMsg && (
        <div
          style={{
            fontSize: '0.8125rem',
            color: 'var(--accent-rose)',
            backgroundColor: 'var(--accent-rose-glow)',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '0.85rem',
            border: '1px solid rgba(244, 63, 94, 0.2)',
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Visualizer Canvas & Time */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          minHeight: '80px',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          width={300}
          height={48}
          style={{ width: '100%', maxWidth: '300px', height: '48px' }}
        />

        <div
          className="mono"
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            marginTop: '0.5rem',
            color: isRecording ? 'var(--accent-amber)' : 'var(--text-secondary)',
          }}
        >
          {isRecording ? formatTime(recordingTime) : audioUrl ? `${formatTime(currentTime)} / ${formatTime(duration || recordingTime)}` : '00:00'}
        </div>
      </div>

      {/* Hidden Audio Player */}
      {audioUrl && <audio ref={audioElementRef} src={audioUrl} preload="metadata" />}

      {/* Control Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          marginTop: '1rem',
        }}
      >
        {!audioUrl && !isRecording && (
          <>
            <button
              type="button"
              onClick={startRecording}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.25rem' }}
            >
              <Mic size={16} />
              <span>Record Voice Note</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary btn-sm"
            >
              <Upload size={14} />
              <span>Upload Audio</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </>
        )}

        {isRecording && (
          <button
            type="button"
            onClick={stopRecording}
            className="btn btn-danger"
            style={{ padding: '0.65rem 1.5rem', animation: 'pulseGlow 1.5s infinite' }}
          >
            <Square size={16} />
            <span>Stop Recording</span>
          </button>
        )}

        {audioUrl && !isRecording && (
          <>
            <button
              type="button"
              onClick={togglePlay}
              className="btn btn-primary btn-sm"
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              <span>{isPlaying ? 'Pause' : 'Play Voice'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="btn btn-ghost btn-sm"
              title="Delete and re-record"
            >
              <RotateCcw size={14} />
              <span>Re-record</span>
            </button>
          </>
        )}
      </div>

      {/* Transcribed Speech Snippet */}
      {transcript && (
        <div
          style={{
            marginTop: '0.85rem',
            padding: '0.65rem 0.85rem',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>Transcribed: </span>
          {transcript}
        </div>
      )}
    </div>
  );
};
