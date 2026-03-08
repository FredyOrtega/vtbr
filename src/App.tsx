/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, memo, useEffect } from 'react';
import { Experience } from './components/Experience';
import { Mic, MicOff, HelpCircle, X, Play, Pause, Youtube, Volume2, VolumeX } from 'lucide-react';
import ReactPlayer from 'react-player/youtube';

// Memoized Player component to prevent re-renders on mouse move
const BackgroundPlayer = memo(({
  videoUrl,
  isPlaying,
  isMuted,
  onReady,
  onStart,
  onError
}: any) => {
  console.log('DEBUG: BackgroundPlayer Rendering with URL:', videoUrl);
  const Player = ReactPlayer as any;
  return (
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-slate-950 border border-white/5">
      <Player
        url={videoUrl}
        playing
        muted
        width="100%"
        height="100%"
        controls={false}
      />
    </div>
  );
});

export default function App() {
  const [isAudioStarted, setIsAudioStarted] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false); // Default to false, wait for user
  const [isMuted, setIsMuted] = useState(false); // Default unmuted since user will click play
  const [isReady, setIsReady] = useState(false);
  const isReadyRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Head tracking state
  const [headTransform, setHeadTransform] = useState({
    rotation: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0 },
    expressions: { browLeft: 0, browRight: 0 }
  });

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 256;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyserNode);

      setAnalyser(analyserNode);
      setIsAudioStarted(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please allow permissions.');
    }
  };

  const stopAudio = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setAnalyser(null);
    setIsAudioStarted(false);
  };

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [playerError, setPlayerError] = useState<string | null>(null);

  const handlePlayerReady = useCallback(() => {
    console.log('DEBUG: Player Ready');
    setPlayerError(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Small delay to ensure state sync
    setTimeout(() => {
      setIsReady(true);
      isReadyRef.current = true;
      setIsLoading(false);
    }, 300);
  }, []);

  const handlePlayerStart = useCallback(() => {
    console.log('DEBUG: Player Started');
    setPlayerError(null);
    setIsLoading(false);
  }, []);

  const handlePlayerError = useCallback((e: any) => {
    console.error('Player Error', e);
    setPlayerError('This video could not be loaded. It might be private, restricted by age/region, or the owner has disabled embedding.');
    setIsLoading(false);
  }, []);

  const handleLoadVideo = () => {
    if (inputUrl) {
      setPlayerError(null);
      // Clear any existing timeout
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      // Normalize URL to ensure compatibility
      let cleanUrl = inputUrl.trim();

      if (cleanUrl.length < 3) {
        setPlayerError('Please enter a valid YouTube URL or Video ID.');
        return;
      }

      // Handle various YouTube URL formats
      try {
        if (cleanUrl.includes('youtu.be/')) {
          const videoId = cleanUrl.split('youtu.be/')[1]?.split(/[?#]/)[0];
          if (videoId) cleanUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (cleanUrl.includes('youtube.com/shorts/')) {
          const videoId = cleanUrl.split('youtube.com/shorts/')[1]?.split(/[?#]/)[0];
          if (videoId) cleanUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (cleanUrl.includes('youtube.com/watch')) {
          const urlObj = new URL(cleanUrl);
          const videoId = urlObj.searchParams.get('v');
          if (videoId) cleanUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (cleanUrl.includes('youtube.com/embed/')) {
          const videoId = cleanUrl.split('youtube.com/embed/')[1]?.split(/[?#]/)[0];
          if (videoId) cleanUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (!cleanUrl.includes('/') && (cleanUrl.length === 11 || cleanUrl.length === 12)) {
          // Assume it's a direct Video ID if it's 11 or 12 chars (standard YouTube ID length)

        }
      } catch (e) {
        console.error('URL parsing error', e);
      }

      console.log('DEBUG: Loading Video URL:', cleanUrl);
      setVideoUrl(cleanUrl);
      setShowHelp(false);
      setIsPlaying(true); // Enable autoplay
      setIsMuted(true);   // Mute to allow autoplay
      setIsReady(false);
      isReadyRef.current = false;
      setIsLoading(true);

      // Safety timeout: if onReady doesn't fire in 8 seconds, show a potential restriction message
      timeoutRef.current = setTimeout(() => {
        if (!isReadyRef.current) {
          console.warn("Player slow to load...");
        }
      }, 20000);
    }
  };

  // Mouse tracking logic
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;

    setHeadTransform(prev => ({
      ...prev,
      rotation: {
        x: y * 0.5, // Look up/down
        y: -x * 0.5, // Look left/right
        z: 0
      },
      position: { x: x * 0.5, y: y * 0.5 }
    }));
  }, []);

  const Player = ReactPlayer as any;

  return (
    <div
      className={`w-full h-screen relative overflow-hidden flex items-center justify-center ${videoUrl ? 'bg-black' : 'bg-slate-900'}`}
      onMouseMove={handleMouseMove}
    >
      {/* Background Video Player */}
      {videoUrl && (
        <div className="absolute inset-0 z-0 overflow-hidden bg-black">
          <BackgroundPlayer
            videoUrl={videoUrl}
            isPlaying={isPlaying}
            isMuted={isMuted}
            onReady={handlePlayerReady}
            onStart={handlePlayerStart}
            onError={handlePlayerError}
          />

          {/* Loading / Play Overlay */}
          {(playerError || isLoading) && (
            <div className={`absolute inset-0 flex items-center justify-center z-10 pointer-events-auto transition-opacity duration-500 ${isLoading || playerError ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'}`}>
              {playerError ? (
                <div className="text-white flex flex-col items-center gap-6 p-10 bg-slate-900/90 backdrop-blur-xl border border-red-500/50 rounded-[2rem] max-w-sm text-center shadow-2xl animate-in fade-in zoom-in duration-300">
                  <div className="p-4 bg-red-500/20 rounded-2xl">
                    <Youtube className="w-12 h-12 text-red-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold uppercase tracking-tight">Video Restricted</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {playerError}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 w-full">
                    <button
                      onClick={() => {
                        setVideoUrl('');
                        setPlayerError(null);
                        setInputUrl('');
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95"
                    >
                      TRY ANOTHER VIDEO
                    </button>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                      Tip: Ensure the video is Public and "Allow Embedding" is enabled.
                    </p>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="text-white flex flex-col items-center gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-medium tracking-widest uppercase">Loading Background...</span>
                  </div>
                  <div className="flex flex-col gap-2 items-center mt-4">
                    <button
                      onClick={() => {
                        setIsLoading(false);
                        setIsReady(true);
                        setIsPlaying(true);
                      }}
                      className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      Force Start Player
                    </button>
                    <button
                      onClick={() => {
                        setVideoUrl('');
                        setPlayerError(null);
                      }}
                      className="text-[10px] text-white/40 hover:text-white underline uppercase tracking-tighter"
                    >
                      Cancel and try another
                    </button>
                  </div>
                  <p className="text-[9px] text-white/20 max-w-[180px] text-center uppercase mt-2">
                    Note: Some YouTube videos may have embedding disabled.
                  </p>
                </div>
              ) : isReady && !isPlaying ? (
                <button
                  onClick={() => setIsPlaying(true)}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full font-bold text-sm shadow-2xl transform transition-all hover:scale-105 flex items-center gap-2 border border-white/20"
                >
                  <Play className="w-4 h-4 fill-current" />
                  START BACKGROUND
                </button>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Main Content / URL Input when no video */}
      {!videoUrl && (
        <div className="relative z-10 w-full max-w-xl px-6 py-12 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center gap-2">
            <div className="p-4 bg-red-500/20 rounded-2xl">
              <Youtube className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight text-center">
              YouTube Player <span className="text-red-500">Overlay</span>
            </h1>
            <p className="text-slate-400 text-sm text-center max-w-sm">
              Enter a YouTube URL to start the player. The avatar will react to your microphone.
            </p>
          </div>

          <div className="w-full flex gap-3">
            <input
              type="text"
              placeholder="Paste YouTube URL here..."
              className="flex-1 bg-slate-900/50 border border-white/10 rounded-2xl px-6 py-4 text-white text-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLoadVideo()}
            />
            <button
              onClick={handleLoadVideo}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-600/20"
            >
              LOAD
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avatar</span>
              <p className="text-xs text-slate-300">Tracks your mouse and blinks automatically.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lip Sync</span>
              <p className="text-xs text-slate-300">Start the mic to make the avatar talk with you.</p>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Overlay - Bottom Right */}
      <div className="absolute bottom-4 right-4 w-64 h-64 rounded-3xl overflow-hidden shadow-2xl transition-all hover:scale-105 z-50 border border-white/10">
        {/* Removed backdrop-blur to prevent rendering artifacts over iframe */}
        <div className="w-full h-full bg-black/5">
          <Experience analyser={analyser} headTransform={headTransform} />
        </div>
      </div>

      {/* Controls - Bottom Center */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-4">
        <div className="flex gap-4">
          <button
            onClick={isAudioStarted ? stopAudio : startAudio}
            className={`
              flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-all
              ${isAudioStarted
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
              } shadow-lg
            `}
          >
            {isAudioStarted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            {isAudioStarted ? 'Stop Mic' : 'Start Mic'}
          </button>

          {videoUrl && (
            <>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-full font-medium transition-all bg-slate-700 hover:bg-slate-600 text-white shadow-slate-700/30 shadow-lg"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-full font-medium transition-all bg-slate-700 hover:bg-slate-600 text-white shadow-slate-700/30 shadow-lg"
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <button
                onClick={() => {
                  setVideoUrl('');
                  setInputUrl('');
                  setIsPlaying(false);
                  setIsReady(false);
                  setIsLoading(false);
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-full font-medium transition-all bg-red-900/40 hover:bg-red-900/60 text-white shadow-lg border border-red-500/30"
                title="Reset Video"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        <div className="flex gap-2">
          {isAudioStarted && (
            <div className="flex items-center gap-2 px-4 py-2 bg-black/80 text-white rounded-full text-xs font-mono border border-white/10">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              AUDIO ACTIVE
            </div>
          )}
        </div>
      </div>

      {/* Help/YouTube Modal - REMOVED since it's now integrated or redundant */}
    </div>
  );
}

