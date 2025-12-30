'use client';

import { useRef } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';

interface CSVUploaderProps {
    onUpload: (csvText: string) => void;
    isLoading: boolean;
    compact?: boolean;
}

export default function CSVUploader({ onUpload, isLoading, compact = false }: CSVUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            onUpload(text);
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    if (compact) {
        return (
            <>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 text-white text-sm rounded-lg transition-colors"
                >
                    <Upload className="w-4 h-4" />
                    Upload
                </button>
            </>
        );
    }

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 text-white rounded-xl transition-all font-semibold border-2 border-dashed border-slate-500 hover:border-slate-400"
            >
                <FileSpreadsheet className="w-5 h-5" />
                <span>Upload CSV File</span>
            </button>
        </>
    );
}
