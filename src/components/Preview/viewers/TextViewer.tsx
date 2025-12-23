/**
 * Text Viewer Component
 * 
 * Simple text file viewer/editor.
 * Supports plain text, markdown, and code files.
 */

import React, { useState, useEffect } from 'react';
import { FileText, Copy, Check, Download, WrapText } from 'lucide-react';
import { ViewerBaseProps } from '../types';

interface TextViewerProps extends ViewerBaseProps {
    className?: string;
}

export const TextViewer: React.FC<TextViewerProps> = ({
    file,
    onError,
    className = '',
}) => {
    const [content, setContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [wordWrap, setWordWrap] = useState(true);

    // Load text content
    useEffect(() => {
        const loadContent = async () => {
            setIsLoading(true);
            try {
                // Content can be string directly or from blobUrl
                if (typeof file.content === 'string' && file.content.length > 0) {
                    setContent(file.content);
                } else if (file.blobUrl) {
                    // If it's a blob URL, fetch the content
                    const response = await fetch(file.blobUrl);
                    const text = await response.text();
                    setContent(text);
                } else {
                    setContent('No content available');
                }
            } catch (err) {
                console.error('Failed to load text content:', err);
                onError?.('Failed to load text content');
                setContent('Error loading content');
            } finally {
                setIsLoading(false);
            }
        };

        loadContent();
    }, [file, onError]);

    // Copy to clipboard
    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Download file
    const downloadFile = () => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Get line count
    const lineCount = content.split('\n').length;
    const charCount = content.length;

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center h-full bg-gray-900 ${className}`}>
                <div className="text-gray-400 animate-pulse">Loading...</div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-400" />
                    <span className="text-sm font-medium text-gray-300 truncate max-w-xs">{file.name}</span>
                    <span className="text-xs text-gray-500">
                        {lineCount} lines • {charCount.toLocaleString()} chars
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Word wrap toggle */}
                    <button
                        onClick={() => setWordWrap(!wordWrap)}
                        className={`p-1.5 rounded transition-colors ${wordWrap ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-gray-700 text-gray-400'}`}
                        title={wordWrap ? 'Disable Word Wrap' : 'Enable Word Wrap'}
                    >
                        <WrapText size={16} />
                    </button>

                    {/* Copy button */}
                    <button
                        onClick={copyToClipboard}
                        className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        title="Copy to Clipboard"
                    >
                        {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>

                    {/* Download button */}
                    <button
                        onClick={downloadFile}
                        className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        title="Download File"
                    >
                        <Download size={16} />
                    </button>
                </div>
            </div>

            {/* Text content with line numbers */}
            <div className="flex-1 overflow-auto font-mono text-sm">
                <div className="flex min-h-full">
                    {/* Line numbers */}
                    <div className="flex-shrink-0 select-none text-right pr-4 pl-4 py-4 text-gray-600 bg-gray-800/50 border-r border-gray-700">
                        {content.split('\n').map((_, i) => (
                            <div key={i} className="leading-6">{i + 1}</div>
                        ))}
                    </div>

                    {/* Content */}
                    <pre
                        className={`flex-1 p-4 text-gray-200 leading-6 ${wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}`}
                    >
                        {content}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default TextViewer;
