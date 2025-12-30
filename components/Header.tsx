'use client';

import { useRef } from 'react';
import { RefreshCw, Shield, Clock, Upload, Database, FileSpreadsheet, Trash2 } from 'lucide-react';

interface HeaderProps {
    lastUpdated: Date | null;
    isLoading: boolean;
    onRefresh?: () => void;
    dataSource?: 'none' | 'sheets' | 'upload';
    onCSVUpload?: (csvText: string) => void;
    onClearData?: () => void;
}

export default function Header({
    lastUpdated,
    isLoading,
    onRefresh,
    dataSource = 'none',
    onCSVUpload,
    onClearData
}: HeaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatTime = (date: Date) => {
        return date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !onCSVUpload) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            onCSVUpload(text);
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    return (
        <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
            <div className="max-w-[1920px] mx-auto px-6 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo & Title */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            {dataSource !== 'none' && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">
                                Cloud Armor Command Center
                            </h1>
                            <p className="text-slate-400 text-xs flex items-center gap-2">
                                <span>Security Dashboard</span>
                                {dataSource !== 'none' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700/50 rounded text-xs">
                                        {dataSource === 'sheets' ? (
                                            <>
                                                <Database className="w-3 h-3" />
                                                Sheets
                                            </>
                                        ) : (
                                            <>
                                                <FileSpreadsheet className="w-3 h-3" />
                                                CSV
                                            </>
                                        )}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {/* Last Updated */}
                        {lastUpdated && (
                            <div className="hidden md:flex items-center gap-2 text-slate-400 text-xs">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(lastUpdated)}</span>
                            </div>
                        )}

                        {/* Clear Data Button */}
                        {onClearData && dataSource !== 'none' && (
                            <button
                                onClick={onClearData}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm border border-red-500/30"
                                title="Clear data and start over"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Clear</span>
                            </button>
                        )}

                        {/* Upload New CSV */}
                        {onCSVUpload && (
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
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 text-white rounded-lg transition-colors text-sm border border-slate-600"
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Upload CSV</span>
                                </button>
                            </>
                        )}

                        {/* Refresh Button */}
                        {onRefresh && (
                            <button
                                onClick={onRefresh}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-lg transition-all text-sm font-medium"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">{isLoading ? 'Loading...' : 'Refresh'}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
