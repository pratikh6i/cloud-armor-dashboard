'use client';

import { useMemo, useState } from 'react';
import { CloudArmorRule } from '@/lib/types';
import { paginateRules } from '@/lib/dataParser';
import {
    Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Database, Download, ArrowUp, ArrowDown, ArrowUpDown, Settings2, X, Eye, EyeOff, Copy
} from 'lucide-react';

interface MasterLedgerProps {
    data: CloudArmorRule[];
    isLoading: boolean;
    currentPage: number;
    onPageChange: (page: number) => void;
    searchQuery: string;
    onSearch: (query: string) => void;
}

type SortField = 'projectName' | 'policyName' | 'adaptiveProtection' | 'ruleDescription' | 'matchExpression' | 'status' | 'priority';
type SortOrder = 'asc' | 'desc';

interface ColumnConfig {
    key: SortField;
    label: string;
    visible: boolean;
    width: string;
}

const defaultColumns: ColumnConfig[] = [
    { key: 'projectName', label: 'Project', visible: true, width: 'w-[180px]' },
    { key: 'policyName', label: 'Policy', visible: true, width: 'w-[200px]' },
    { key: 'adaptiveProtection', label: 'Adaptive', visible: true, width: 'w-[90px]' },
    { key: 'ruleDescription', label: 'Description', visible: true, width: 'w-[250px]' },
    { key: 'matchExpression', label: 'Match Expression', visible: true, width: 'w-[300px]' },
    { key: 'status', label: 'Action', visible: true, width: 'w-[100px]' },
    { key: 'priority', label: 'Priority', visible: true, width: 'w-[90px]' },
];

export default function MasterLedger({
    data,
    isLoading,
    currentPage,
    onPageChange,
    searchQuery,
    onSearch,
}: MasterLedgerProps) {
    const pageSize = 25;
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
    const [showColumnSettings, setShowColumnSettings] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortField) return data;

        return [...data].sort((a, b) => {
            let aVal: string | number | boolean = a[sortField];
            let bVal: string | number | boolean = b[sortField];

            if (typeof aVal === 'boolean') {
                aVal = aVal ? 1 : 0;
                bVal = bVal ? 1 : 0;
            } else if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = (bVal as string).toLowerCase();
            }

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortField, sortOrder]);

    const paginatedResult = useMemo(() => {
        return paginateRules(sortedData, currentPage, pageSize);
    }, [sortedData, currentPage]);

    const { data: displayData, totalPages, totalItems } = paginatedResult;

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
        onPageChange(1);
    };

    const toggleColumn = (key: SortField) => {
        setColumns(cols =>
            cols.map(col => col.key === key ? { ...col, visible: !col.visible } : col)
        );
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
        return sortOrder === 'asc'
            ? <ArrowUp className="w-3 h-3 text-blue-400" />
            : <ArrowDown className="w-3 h-3 text-blue-400" />;
    };

    const handleExport = () => {
        const visibleCols = columns.filter(c => c.visible);
        const headers = visibleCols.map(c => c.label);
        const rows = sortedData.map(rule =>
            visibleCols.map(col => {
                const val = rule[col.key];
                if (col.key === 'adaptiveProtection') return val ? 'Enabled' : 'Disabled';
                return String(val).replace(/"/g, '""');
            })
        );

        const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cloud-armor-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const getActionBadge = (action: string) => {
        const a = action.toLowerCase();
        if (a.includes('deny')) return 'bg-red-600/30 text-red-300 border-red-500/50';
        if (a.includes('allow')) return 'bg-green-600/30 text-green-300 border-green-500/50';
        if (a.includes('throttle')) return 'bg-amber-600/30 text-amber-300 border-amber-500/50';
        return 'bg-slate-600/30 text-slate-300 border-slate-500/50';
    };

    const getAdaptiveBadge = (enabled: boolean) => {
        return enabled
            ? 'bg-green-600/30 text-green-300 border-green-500/50'
            : 'bg-slate-600/30 text-slate-400 border-slate-600/50';
    };

    const getPriorityBadge = (priority: number) => {
        if (priority === 2147483647) return 'bg-slate-600/30 text-slate-400 border-slate-600/50';
        if (priority < 100) return 'bg-red-600/30 text-red-300 border-red-500/50';
        if (priority < 1000) return 'bg-amber-600/30 text-amber-300 border-amber-500/50';
        return 'bg-blue-600/30 text-blue-300 border-blue-500/50';
    };

    const visibleColumns = columns.filter(c => c.visible);

    if (isLoading) {
        return (
            <div className="bg-slate-800 rounded-xl border border-slate-600 overflow-hidden">
                <div className="p-4 border-b border-slate-600 animate-pulse">
                    <div className="h-6 w-48 bg-slate-700 rounded" />
                </div>
                <div className="divide-y divide-slate-700">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="p-4 flex gap-4 animate-pulse">
                            {[...Array(6)].map((_, j) => (
                                <div key={j} className="h-4 bg-slate-700 rounded" style={{ width: `${Math.random() * 100 + 50}px` }} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-600 overflow-hidden shadow-xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-600 bg-slate-800/80">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/20 rounded-lg">
                            <Database className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Master Ledger</h3>
                            <p className="text-sm text-slate-400">
                                {totalItems.toLocaleString()} rules
                                {sortField && <span className="text-blue-400"> • Sorted by {columns.find(c => c.key === sortField)?.label}</span>}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {/* Search */}
                        <div className="relative flex-1 sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Quick search..."
                                value={searchQuery}
                                onChange={(e) => onSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        {/* Column Settings */}
                        <div className="relative">
                            <button
                                onClick={() => setShowColumnSettings(!showColumnSettings)}
                                className={`p-2 rounded-lg transition-colors ${showColumnSettings ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                                title="Column settings"
                            >
                                <Settings2 className="w-5 h-5" />
                            </button>

                            {showColumnSettings && (
                                <div className="absolute right-0 top-full mt-2 w-60 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50">
                                    <div className="p-3 border-b border-slate-600 flex items-center justify-between">
                                        <span className="text-sm font-semibold text-white">Show Columns</span>
                                        <button onClick={() => setShowColumnSettings(false)} className="text-slate-400 hover:text-white">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                                        {columns.map(col => (
                                            <button
                                                key={col.key}
                                                onClick={() => toggleColumn(col.key)}
                                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-700/50 text-sm"
                                            >
                                                <span className={col.visible ? 'text-white font-medium' : 'text-slate-500'}>{col.label}</span>
                                                {col.visible ? (
                                                    <Eye className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <EyeOff className="w-4 h-4 text-slate-500" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Export */}
                        <button
                            onClick={handleExport}
                            className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                            title="Export to CSV"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-900">
                            {visibleColumns.map(col => (
                                <th
                                    key={col.key}
                                    onClick={() => handleSort(col.key)}
                                    className={`px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:text-white hover:bg-slate-800 transition-colors ${col.width}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{col.label}</span>
                                        {getSortIcon(col.key)}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {displayData.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length} className="px-4 py-16 text-center text-slate-400">
                                    No results found
                                </td>
                            </tr>
                        ) : (
                            displayData.map((rule, index) => (
                                <tr
                                    key={`${rule.policyName}-${rule.priority}-${index}`}
                                    className="hover:bg-slate-700/30 transition-colors"
                                >
                                    {visibleColumns.map(col => {
                                        if (col.key === 'projectName') {
                                            return (
                                                <td key={col.key} className="px-4 py-3">
                                                    <span className="text-sm font-semibold text-white">{rule.projectName}</span>
                                                </td>
                                            );
                                        }
                                        if (col.key === 'policyName') {
                                            return (
                                                <td key={col.key} className="px-4 py-3">
                                                    <span className="text-sm text-slate-200">{rule.policyName}</span>
                                                </td>
                                            );
                                        }
                                        if (col.key === 'adaptiveProtection') {
                                            return (
                                                <td key={col.key} className="px-4 py-3">
                                                    <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded border ${getAdaptiveBadge(rule.adaptiveProtection)}`}>
                                                        {rule.adaptiveProtection ? 'ON' : 'OFF'}
                                                    </span>
                                                </td>
                                            );
                                        }
                                        if (col.key === 'ruleDescription') {
                                            return (
                                                <td key={col.key} className="px-4 py-3">
                                                    <span className="text-sm text-slate-200 block truncate max-w-[250px]" title={rule.ruleDescription}>
                                                        {rule.ruleDescription || '-'}
                                                    </span>
                                                </td>
                                            );
                                        }
                                        if (col.key === 'matchExpression') {
                                            return (
                                                <td key={col.key} className="px-4 py-3">
                                                    <div className="flex items-center gap-2 max-w-[300px]">
                                                        <code className="text-xs text-cyan-300 bg-slate-900/80 px-2 py-1 rounded truncate flex-1 font-mono" title={rule.matchExpression}>
                                                            {rule.matchExpression || '-'}
                                                        </code>
                                                        {rule.matchExpression && (
                                                            <button
                                                                onClick={() => copyToClipboard(rule.matchExpression, index)}
                                                                className="p-1 text-slate-400 hover:text-white shrink-0"
                                                                title="Copy to clipboard"
                                                            >
                                                                {copiedIndex === index ? (
                                                                    <span className="text-green-400 text-xs">✓</span>
                                                                ) : (
                                                                    <Copy className="w-3.5 h-3.5" />
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        }
                                        if (col.key === 'status') {
                                            return (
                                                <td key={col.key} className="px-4 py-3">
                                                    <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded border uppercase ${getActionBadge(rule.status)}`}>
                                                        {rule.status || '-'}
                                                    </span>
                                                </td>
                                            );
                                        }
                                        if (col.key === 'priority') {
                                            return (
                                                <td key={col.key} className="px-4 py-3">
                                                    <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded border ${getPriorityBadge(rule.priority)}`}>
                                                        {rule.priority === 2147483647 ? 'DEFAULT' : rule.priority}
                                                    </span>
                                                </td>
                                            );
                                        }
                                        return null;
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-800/50">
                    <div className="text-sm text-slate-400">
                        Page <span className="text-white font-semibold">{currentPage}</span> of <span className="text-white font-semibold">{totalPages}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => onPageChange(1)} disabled={currentPage === 1}
                            className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronsLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
                            className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1 mx-2">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) pageNum = i + 1;
                                else if (currentPage <= 3) pageNum = i + 1;
                                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                else pageNum = currentPage - 2 + i;
                                return (
                                    <button key={pageNum} onClick={() => onPageChange(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-sm font-semibold ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}>
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
                            className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}
                            className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronsRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
