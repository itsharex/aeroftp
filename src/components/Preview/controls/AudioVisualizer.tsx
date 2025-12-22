/**
 * Audio Visualizer Component (Canvas-based)
 * 
 * Creates real-time audio visualization using Web Audio API AnalyserNode.
 * Supports two modes: waveform and frequency spectrum.
 * 
 * Features:
 * - Real-time frequency bars visualization
 * - Waveform oscilloscope mode
 * - Cyber/Tokyo Night color theme
 * - Smooth animations with requestAnimationFrame
 */

import React, { useRef, useEffect, useCallback } from 'react';

export type VisualizerMode = 'bars' | 'waveform';

interface AudioVisualizerProps {
    analyser: AnalyserNode | null;
    mode?: VisualizerMode;
    isPlaying: boolean;
    className?: string;
}

// Tokyo Night color palette for visualizer
const COLORS = {
    primary: '#7aa2f7',    // Blue
    secondary: '#bb9af7',  // Purple
    accent: '#7dcfff',     // Cyan
    background: '#1a1b26', // Dark
    glow: 'rgba(122, 162, 247, 0.3)',
};

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
    analyser,
    mode = 'bars',
    isPlaying,
    className = '',
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

    // Initialize data array when analyser changes
    useEffect(() => {
        if (analyser) {
            const bufferLength = analyser.frequencyBinCount;
            const buffer = new ArrayBuffer(bufferLength);
            dataArrayRef.current = new Uint8Array(buffer);
        }
    }, [analyser]);

    // Draw frequency bars
    const drawBars = useCallback((
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        dataArray: Uint8Array
    ) => {
        const barCount = 64; // Number of bars to display
        const barWidth = (width / barCount) - 2;
        const step = Math.floor(dataArray.length / barCount);

        for (let i = 0; i < barCount; i++) {
            const value = dataArray[i * step];
            const percent = value / 255;
            const barHeight = height * percent * 0.9;
            const x = i * (barWidth + 2);
            const y = height - barHeight;

            // Create gradient for each bar
            const gradient = ctx.createLinearGradient(x, height, x, y);
            gradient.addColorStop(0, COLORS.primary);
            gradient.addColorStop(0.5, COLORS.secondary);
            gradient.addColorStop(1, COLORS.accent);

            // Glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = COLORS.glow;

            // Draw bar with rounded top
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, [barWidth / 2, barWidth / 2, 0, 0]);
            ctx.fill();

            // Reset shadow for next bar
            ctx.shadowBlur = 0;
        }
    }, []);

    // Draw waveform oscilloscope
    const drawWaveform = useCallback((
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        dataArray: Uint8Array
    ) => {
        const sliceWidth = width / dataArray.length;
        let x = 0;

        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = COLORS.accent;

        // Draw waveform line
        ctx.lineWidth = 2;
        ctx.strokeStyle = COLORS.accent;
        ctx.beginPath();

        for (let i = 0; i < dataArray.length; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Reset shadow
        ctx.shadowBlur = 0;
    }, []);

    // Animation loop
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        if (!canvas || !ctx || !analyser || !dataArrayRef.current) {
            animationRef.current = requestAnimationFrame(draw);
            return;
        }

        const { width, height } = canvas;

        // Clear canvas
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, width, height);

        // Get audio data
        if (mode === 'bars') {
            analyser.getByteFrequencyData(dataArrayRef.current);
            drawBars(ctx, width, height, dataArrayRef.current);
        } else {
            analyser.getByteTimeDomainData(dataArrayRef.current);
            drawWaveform(ctx, width, height, dataArrayRef.current);
        }

        // Continue animation
        animationRef.current = requestAnimationFrame(draw);
    }, [analyser, mode, drawBars, drawWaveform]);

    // Start/stop animation based on playing state
    useEffect(() => {
        if (isPlaying && analyser) {
            draw();
        } else {
            cancelAnimationFrame(animationRef.current);

            // Draw idle state
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx) {
                ctx.fillStyle = COLORS.background;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw center line for waveform mode when idle
                if (mode === 'waveform') {
                    ctx.strokeStyle = `${COLORS.primary}40`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(0, canvas.height / 2);
                    ctx.lineTo(canvas.width, canvas.height / 2);
                    ctx.stroke();
                }
            }
        }

        return () => cancelAnimationFrame(animationRef.current);
    }, [isPlaying, analyser, mode, draw]);

    // Handle canvas resize
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={`w-full h-full ${className}`}
            style={{
                background: COLORS.background,
                borderRadius: '8px',
            }}
        />
    );
};

export default AudioVisualizer;
