/**
 * Audio Player Component
 * 
 * Full-featured audio player with:
 * - HTML5 Audio + Web Audio API integration
 * - Playback controls (play/pause/seek/volume)
 * - Real-time waveform/spectrum visualizer
 * - 10-band graphic equalizer
 * - Metadata display (title, artist, album art)
 * - Playback speed control
 * - Loop toggle
 * 
 * Uses Web Audio API for visualizer and EQ processing.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
    Repeat, Gauge, Activity, BarChart2
} from 'lucide-react';
import { ViewerBaseProps, PlaybackState, EqualizerState, MediaMetadata } from '../types';
import { formatDuration } from '../utils/fileTypes';
import { AudioVisualizer, VisualizerMode } from '../controls/AudioVisualizer';
import { AudioMixer, EQ_BANDS } from '../controls/AudioMixer';

interface AudioPlayerProps extends ViewerBaseProps {
    className?: string;
}

// Default EQ state
const defaultEQState: EqualizerState = {
    enabled: true,
    bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    balance: 0,
    presetName: 'Flat',
};

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
    file,
    onError,
    className = '',
}) => {
    // Refs
    const audioRef = useRef<HTMLAudioElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const filtersRef = useRef<BiquadFilterNode[]>([]);
    const gainNodeRef = useRef<GainNode | null>(null);
    const pannerRef = useRef<StereoPannerNode | null>(null);

    // State
    const [playback, setPlayback] = useState<PlaybackState>({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 0.8,
        isMuted: false,
        playbackRate: 1,
        isLooping: false,
        bufferedPercent: 0,
    });
    const [eqState, setEQState] = useState<EqualizerState>(defaultEQState);
    const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
    const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');
    const [showMixer, setShowMixer] = useState(false);
    const [isAudioReady, setIsAudioReady] = useState(false);

    // Audio source URL
    const audioSrc = file.blobUrl || file.content as string || '';

    // Initialize Web Audio API
    const initAudioContext = useCallback(() => {
        if (audioContextRef.current || !audioRef.current) return;

        try {
            // Create AudioContext
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = ctx;

            // Create source from audio element
            const source = ctx.createMediaElementSource(audioRef.current);
            sourceRef.current = source;

            // Create analyser for visualizer
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            // Create gain node for volume
            const gainNode = ctx.createGain();
            gainNodeRef.current = gainNode;

            // Create stereo panner for balance
            const panner = ctx.createStereoPanner();
            pannerRef.current = panner;

            // Create EQ filters (10 bands)
            const filters = EQ_BANDS.map((band) => {
                const filter = ctx.createBiquadFilter();
                filter.type = 'peaking';
                filter.frequency.value = band.freq;
                filter.Q.value = 1;
                filter.gain.value = 0;
                return filter;
            });
            filtersRef.current = filters;

            // Connect: source -> filters -> panner -> gain -> analyser -> destination
            let lastNode: AudioNode = source;
            filters.forEach((filter) => {
                lastNode.connect(filter);
                lastNode = filter;
            });
            lastNode.connect(panner);
            panner.connect(gainNode);
            gainNode.connect(analyser);
            analyser.connect(ctx.destination);

        } catch (error) {
            console.error('Failed to initialize Web Audio API:', error);
        }
    }, []);

    // Update EQ filters when state changes
    useEffect(() => {
        if (!filtersRef.current.length) return;

        filtersRef.current.forEach((filter, index) => {
            filter.gain.value = eqState.enabled ? eqState.bands[index] : 0;
        });
    }, [eqState.bands, eqState.enabled]);

    // Update balance
    useEffect(() => {
        if (pannerRef.current) {
            pannerRef.current.pan.value = eqState.balance;
        }
    }, [eqState.balance]);

    // Update volume
    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = playback.isMuted ? 0 : playback.volume;
        }
    }, [playback.volume, playback.isMuted]);

    // Audio event handlers
    const handleLoadedMetadata = useCallback(() => {
        if (audioRef.current) {
            setPlayback(prev => ({
                ...prev,
                duration: audioRef.current!.duration,
            }));
            setIsAudioReady(true);

            // Extract metadata from file name (basic)
            setMetadata({
                title: file.name.replace(/\.[^/.]+$/, ''),
            });
        }
    }, [file.name]);

    const handleTimeUpdate = useCallback(() => {
        if (audioRef.current) {
            setPlayback(prev => ({
                ...prev,
                currentTime: audioRef.current!.currentTime,
            }));
        }
    }, []);

    const handleEnded = useCallback(() => {
        if (playback.isLooping && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
        } else {
            setPlayback(prev => ({ ...prev, isPlaying: false }));
        }
    }, [playback.isLooping]);

    const handleProgress = useCallback(() => {
        if (audioRef.current && audioRef.current.buffered.length > 0) {
            const bufferedEnd = audioRef.current.buffered.end(audioRef.current.buffered.length - 1);
            const duration = audioRef.current.duration;
            setPlayback(prev => ({
                ...prev,
                bufferedPercent: duration > 0 ? (bufferedEnd / duration) * 100 : 0,
            }));
        }
    }, []);

    const handleError = useCallback(() => {
        onError?.('Failed to load audio file');
    }, [onError]);

    // Playback controls
    const togglePlay = useCallback(async () => {
        if (!audioRef.current) return;

        // Initialize audio context on first play (required by browser policy)
        if (!audioContextRef.current) {
            initAudioContext();
        }

        // Resume audio context if suspended
        if (audioContextRef.current?.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        if (playback.isPlaying) {
            audioRef.current.pause();
        } else {
            await audioRef.current.play();
        }
        setPlayback(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    }, [playback.isPlaying, initAudioContext]);

    const seek = useCallback((time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setPlayback(prev => ({ ...prev, currentTime: time }));
        }
    }, []);

    const setVolume = useCallback((volume: number) => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
            setPlayback(prev => ({ ...prev, volume, isMuted: volume === 0 }));
        }
    }, []);

    const toggleMute = useCallback(() => {
        setPlayback(prev => ({ ...prev, isMuted: !prev.isMuted }));
    }, []);

    const toggleLoop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.loop = !playback.isLooping;
            setPlayback(prev => ({ ...prev, isLooping: !prev.isLooping }));
        }
    }, [playback.isLooping]);

    const setPlaybackRate = useCallback((rate: number) => {
        if (audioRef.current) {
            audioRef.current.playbackRate = rate;
            setPlayback(prev => ({ ...prev, playbackRate: rate }));
        }
    }, []);

    const skipBackward = useCallback(() => {
        seek(Math.max(0, playback.currentTime - 10));
    }, [playback.currentTime, seek]);

    const skipForward = useCallback(() => {
        seek(Math.min(playback.duration, playback.currentTime + 10));
    }, [playback.currentTime, playback.duration, seek]);

    // Render loading state
    if (!audioSrc) {
        return (
            <div className={`flex items-center justify-center h-full bg-gray-900 ${className}`}>
                <div className="text-gray-500">No audio data available</div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
            {/* Hidden audio element */}
            <audio
                ref={audioRef}
                src={audioSrc}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onProgress={handleProgress}
                onError={handleError}
                crossOrigin="anonymous"
            />

            {/* Visualizer area */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-2xl h-48 relative">
                    {/* Visualizer */}
                    <AudioVisualizer
                        analyser={analyserRef.current}
                        mode={visualizerMode}
                        isPlaying={playback.isPlaying}
                        className="rounded-xl"
                    />

                    {/* Visualizer mode toggle */}
                    <button
                        onClick={() => setVisualizerMode(m => m === 'bars' ? 'waveform' : 'bars')}
                        className="absolute top-2 right-2 p-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-colors"
                        title={visualizerMode === 'bars' ? 'Switch to Waveform' : 'Switch to Bars'}
                    >
                        {visualizerMode === 'bars' ? (
                            <Activity size={16} className="text-cyan-400" />
                        ) : (
                            <BarChart2 size={16} className="text-purple-400" />
                        )}
                    </button>

                    {/* Album art placeholder / branding */}
                    <div className="absolute bottom-2 right-2 text-xs text-gray-600 font-mono opacity-50">
                        AeroPlayer
                    </div>
                </div>
            </div>

            {/* Track info */}
            <div className="text-center px-4 py-2">
                <h3 className="text-lg font-medium text-white truncate">
                    {metadata?.title || file.name}
                </h3>
                {metadata?.artist && (
                    <p className="text-sm text-gray-400">
                        {metadata.artist}
                        {metadata.album && ` • ${metadata.album}`}
                    </p>
                )}
            </div>

            {/* Progress bar */}
            <div className="px-6 py-2">
                <div className="relative h-1.5 bg-gray-700 rounded-full cursor-pointer group"
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const percent = (e.clientX - rect.left) / rect.width;
                        seek(percent * playback.duration);
                    }}
                >
                    {/* Buffered */}
                    <div
                        className="absolute h-full bg-gray-600 rounded-full"
                        style={{ width: `${playback.bufferedPercent}%` }}
                    />
                    {/* Progress */}
                    <div
                        className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: `${(playback.currentTime / playback.duration) * 100}%` }}
                    />
                    {/* Thumb */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ left: `calc(${(playback.currentTime / playback.duration) * 100}% - 6px)` }}
                    />
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500 font-mono">
                    <span>{formatDuration(playback.currentTime)}</span>
                    <span>{formatDuration(playback.duration)}</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 py-4">
                {/* Skip backward */}
                <button
                    onClick={skipBackward}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                    title="Skip -10s"
                >
                    <SkipBack size={20} className="text-gray-400" />
                </button>

                {/* Play/Pause */}
                <button
                    onClick={togglePlay}
                    disabled={!isAudioReady}
                    className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 rounded-full shadow-lg transition-all disabled:opacity-50"
                >
                    {playback.isPlaying ? (
                        <Pause size={24} className="text-white" />
                    ) : (
                        <Play size={24} className="text-white ml-0.5" />
                    )}
                </button>

                {/* Skip forward */}
                <button
                    onClick={skipForward}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                    title="Skip +10s"
                >
                    <SkipForward size={20} className="text-gray-400" />
                </button>
            </div>

            {/* Secondary controls */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-800">
                {/* Volume */}
                <div className="flex items-center gap-2 w-36">
                    <button
                        onClick={toggleMute}
                        className="p-1 hover:bg-gray-800 rounded transition-colors"
                    >
                        {playback.isMuted || playback.volume === 0 ? (
                            <VolumeX size={18} className="text-gray-500" />
                        ) : (
                            <Volume2 size={18} className="text-gray-400" />
                        )}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={playback.isMuted ? 0 : playback.volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="flex-1 h-1 appearance-none bg-gray-700 rounded-full cursor-pointer"
                    />
                </div>

                {/* Center controls */}
                <div className="flex items-center gap-2">
                    {/* Loop */}
                    <button
                        onClick={toggleLoop}
                        className={`p-2 rounded-lg transition-colors ${playback.isLooping ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'
                            }`}
                        title="Toggle Loop"
                    >
                        <Repeat size={16} />
                    </button>

                    {/* Playback speed */}
                    <button
                        onClick={() => {
                            const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
                            const currentIndex = rates.indexOf(playback.playbackRate);
                            const nextIndex = (currentIndex + 1) % rates.length;
                            setPlaybackRate(rates[nextIndex]);
                        }}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Playback Speed"
                    >
                        <Gauge size={14} className="text-gray-400" />
                        <span className="text-xs text-gray-300 font-mono w-8">
                            {playback.playbackRate}x
                        </span>
                    </button>
                </div>

                {/* Mixer toggle */}
                <div className="w-36 flex justify-end">
                    <AudioMixer
                        state={eqState}
                        onStateChange={setEQState}
                        isExpanded={showMixer}
                        onToggleExpand={() => setShowMixer(!showMixer)}
                    />
                </div>
            </div>

            {/* Expanded mixer panel */}
            {showMixer && (
                <div className="px-6 pb-4">
                    <AudioMixer
                        state={eqState}
                        onStateChange={setEQState}
                        isExpanded={true}
                        onToggleExpand={() => setShowMixer(false)}
                    />
                </div>
            )}
        </div>
    );
};

export default AudioPlayer;
