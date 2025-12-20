import React, { useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Save, X, RotateCcw, FileCode } from 'lucide-react';
import { PreviewFile, getFileLanguage } from './types';

interface CodeEditorProps {
    file: PreviewFile | null;
    onSave: (content: string) => Promise<void>;
    onClose: () => void;
    className?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
    file,
    onSave,
    onClose,
    className = '',
}) => {
    const editorRef = useRef<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalContent, setOriginalContent] = useState('');

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        if (file) {
            setOriginalContent(file.content);
        }
    };

    const handleChange = (value: string | undefined) => {
        if (value !== undefined && value !== originalContent) {
            setHasChanges(true);
        } else {
            setHasChanges(false);
        }
    };

    const handleSave = async () => {
        if (!editorRef.current) return;

        const content = editorRef.current.getValue();
        setIsSaving(true);

        try {
            await onSave(content);
            setOriginalContent(content);
            setHasChanges(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        if (editorRef.current && originalContent) {
            editorRef.current.setValue(originalContent);
            setHasChanges(false);
        }
    };

    const language = file ? getFileLanguage(file.name) : 'text';

    // Map our language names to Monaco's
    const monacoLanguage = (lang: string): string => {
        const map: Record<string, string> = {
            'text': 'plaintext',
            'js': 'javascript',
            'ts': 'typescript',
            'jsx': 'javascript',
            'tsx': 'typescript',
            'bash': 'shell',
            'sh': 'shell',
        };
        return map[lang] || lang;
    };

    if (!file) {
        return (
            <div className={`flex flex-col items-center justify-center h-full text-gray-400 ${className}`}>
                <FileCode size={48} className="mb-3 opacity-30" />
                <p>No file selected for editing</p>
                <p className="text-sm mt-1">Right-click on a file and choose "Edit"</p>
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <FileCode size={14} />
                    <span className="font-medium">{file.name}</span>
                    {hasChanges && <span className="text-yellow-400">• Modified</span>}
                    {file.isRemote && <span className="text-blue-400 ml-2">Remote</span>}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleReset}
                        disabled={!hasChanges}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                        title="Reset changes"
                    >
                        <RotateCcw size={12} />
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
                        title="Save file (Ctrl+S)"
                    >
                        <Save size={12} />
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                        title="Close editor"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1">
                <Editor
                    height="100%"
                    language={monacoLanguage(language)}
                    value={file.content}
                    theme="vs-dark"
                    onMount={handleEditorDidMount}
                    onChange={handleChange}
                    options={{
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                        minimap: { enabled: true, scale: 0.8 },
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        lineNumbers: 'on',
                        renderWhitespace: 'selection',
                        tabSize: 2,
                        insertSpaces: true,
                        automaticLayout: true,
                        folding: true,
                        formatOnPaste: true,
                        bracketPairColorization: { enabled: true },
                        padding: { top: 8, bottom: 8 },
                    }}
                />
            </div>
        </div>
    );
};

export default CodeEditor;
