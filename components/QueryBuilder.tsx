'use client';

import { useState, useCallback } from 'react';
import { Search, X, HelpCircle } from 'lucide-react';

interface QueryBuilderProps {
    onQueryChange: (query: string) => void;
    resultCount: number;
}

export default function QueryBuilder({ onQueryChange, resultCount }: QueryBuilderProps) {
    const [query, setQuery] = useState('');
    const [showHelp, setShowHelp] = useState(false);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        onQueryChange(query);
    }, [query, onQueryChange]);

    const handleClear = useCallback(() => {
        setQuery('');
        onQueryChange('');
    }, [onQueryChange]);

    const insertOperator = useCallback((op: string) => {
        setQuery(prev => prev + (prev.trim() ? ' ' : '') + op + ' ');
    }, []);

    return (
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Advanced Query</h3>
                <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="ml-auto text-slate-400 hover:text-white"
                >
                    <HelpCircle className="w-4 h-4" />
                </button>
            </div>

            {showHelp && (
                <div className="mb-3 p-3 bg-slate-900/80 rounded-lg text-xs text-slate-300 space-y-2">
                    <p className="font-medium text-white">Query Syntax:</p>
                    <ul className="space-y-1 ml-2">
                        <li><code className="text-blue-400">term</code> - Search for term in all fields</li>
                        <li><code className="text-blue-400">AND</code> - Both conditions must match</li>
                        <li><code className="text-blue-400">OR</code> - Either condition must match</li>
                        <li><code className="text-blue-400">NOT</code> - Exclude term</li>
                        <li><code className="text-blue-400">project:name</code> - Filter by project</li>
                        <li><code className="text-blue-400">policy:name</code> - Filter by policy</li>
                        <li><code className="text-blue-400">action:deny</code> - Filter by action</li>
                        <li><code className="text-blue-400">priority:&lt;1000</code> - Filter by priority</li>
                    </ul>
                    <p className="text-slate-400 mt-2">Example: <code className="text-green-400">sqli AND NOT project:test</code></p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2">
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g., sqli AND action:deny OR xss NOT project:test"
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Quick Insert Operators */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500">Insert:</span>
                    {['AND', 'OR', 'NOT', 'project:', 'policy:', 'action:', 'priority:'].map(op => (
                        <button
                            key={op}
                            type="button"
                            onClick={() => insertOperator(op)}
                            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                        >
                            {op}
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        Search
                    </button>
                    <span className="text-xs text-slate-400">
                        {resultCount.toLocaleString()} results
                    </span>
                </div>
            </form>
        </div>
    );
}
