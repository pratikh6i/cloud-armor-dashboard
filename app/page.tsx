'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import KPICards from '@/components/KPICards';
import QuickFilters from '@/components/QuickFilters';
import QueryBuilder from '@/components/QueryBuilder';
import { AttackVectorChart, ActionDistributionChart, TopProjectsChart } from '@/components/Charts';
import MasterLedger from '@/components/MasterLedger';
import CSVUploader from '@/components/CSVUploader';
import {
  CloudArmorRule, KPIMetrics, AttackVectorData, ActionDistributionData, ProjectPolicyCount
} from '@/lib/types';
import {
  fetchFromURL,
  parseCSVText,
  parseAdvancedQuery,
  calculateKPIMetrics,
  getAttackVectorDistribution,
  getActionDistribution,
  getTopProjectsByPolicyCount,
  filterByProjects,
  filterByActions,
  filterByAdaptive,
} from '@/lib/dataParser';
import {
  saveDataToStorage, loadDataFromStorage, clearStoredData,
  saveSheetURL, loadSheetURL, clearSheetURL
} from '@/lib/storage';
import { AlertCircle, Database, Link2, RefreshCw, Trash2, Upload, ExternalLink } from 'lucide-react';

export default function Home() {
  // Core data state
  const [rules, setRules] = useState<CloudArmorRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<'none' | 'sheets' | 'upload'>('none');
  const [isHydrated, setIsHydrated] = useState(false);

  // URL state
  const [sheetURL, setSheetURL] = useState<string>('');
  const [showURLInput, setShowURLInput] = useState(false);

  // Filter state
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());
  const [adaptiveFilter, setAdaptiveFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [advancedQuery, setAdvancedQuery] = useState('');
  const [quickSearch, setQuickSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Load from localStorage on mount
  useEffect(() => {
    setIsHydrated(true);

    const storedURL = loadSheetURL();
    if (storedURL) {
      setSheetURL(storedURL);
    }

    const stored = loadDataFromStorage();
    if (stored) {
      try {
        const parsedRules = JSON.parse(stored.rules) as CloudArmorRule[];
        setRules(parsedRules);
        setDataSource(stored.source);
        setLastUpdated(new Date(stored.timestamp));
      } catch (error) {
        console.error('Failed to parse stored data:', error);
        clearStoredData();
      }
    }
    setIsLoading(false);
  }, []);

  // Apply all filters
  const filteredRules = useMemo(() => {
    let result = rules;

    // Quick filters
    result = filterByProjects(result, selectedProjects);
    result = filterByActions(result, selectedActions);
    result = filterByAdaptive(result, adaptiveFilter);

    // Advanced query
    if (advancedQuery.trim()) {
      result = parseAdvancedQuery(result, advancedQuery);
    }

    // Quick search
    if (quickSearch.trim()) {
      const q = quickSearch.toLowerCase();
      result = result.filter(r =>
        r.projectName.toLowerCase().includes(q) ||
        r.policyName.toLowerCase().includes(q) ||
        r.ruleDescription.toLowerCase().includes(q) ||
        r.matchExpression.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
      );
    }

    return result;
  }, [rules, selectedProjects, selectedActions, adaptiveFilter, advancedQuery, quickSearch]);

  // Computed data
  const metrics = useMemo<KPIMetrics | null>(() => {
    if (filteredRules.length === 0) return null;
    return calculateKPIMetrics(filteredRules);
  }, [filteredRules]);

  const attackVectorData = useMemo<AttackVectorData[]>(() => {
    return getAttackVectorDistribution(filteredRules);
  }, [filteredRules]);

  const actionData = useMemo<ActionDistributionData[]>(() => {
    return getActionDistribution(filteredRules);
  }, [filteredRules]);

  const topProjects = useMemo<ProjectPolicyCount[]>(() => {
    return getTopProjectsByPolicyCount(rules, 10);
  }, [rules]);

  // Load from Google Sheets URL
  const loadFromSheets = useCallback(async (url?: string) => {
    const urlToUse = url || sheetURL;
    if (!urlToUse.trim()) {
      setError('Please enter a Google Sheets URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchFromURL(urlToUse);
      setRules(data);
      setDataSource('sheets');
      setLastUpdated(new Date());
      saveDataToStorage(data, 'sheets');
      saveSheetURL(urlToUse);
      setSheetURL(urlToUse);
      setShowURLInput(false);
      resetFilters();
    } catch (err) {
      console.error('Error loading from sheets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load from Google Sheets');
    } finally {
      setIsLoading(false);
    }
  }, [sheetURL]);

  // Refresh from stored URL
  const refreshFromSheets = useCallback(async () => {
    if (sheetURL) {
      await loadFromSheets(sheetURL);
    }
  }, [sheetURL, loadFromSheets]);

  // Handle CSV upload
  const handleCSVUpload = useCallback(async (csvText: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await parseCSVText(csvText);
      if (data.length === 0) {
        throw new Error('No valid data found in CSV file');
      }
      setRules(data);
      setDataSource('upload');
      setLastUpdated(new Date());
      saveDataToStorage(data, 'upload');
      resetFilters();
    } catch (err) {
      console.error('Error parsing CSV:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setSelectedProjects(new Set());
    setSelectedActions(new Set());
    setAdaptiveFilter('all');
    setAdvancedQuery('');
    setQuickSearch('');
    setCurrentPage(1);
  }, []);

  // Clear all data
  const handleClearAll = useCallback(() => {
    clearStoredData();
    clearSheetURL();
    setRules([]);
    setDataSource('none');
    setLastUpdated(null);
    setSheetURL('');
    resetFilters();
  }, [resetFilters]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProjects, selectedActions, adaptiveFilter, advancedQuery, quickSearch]);

  // Don't render until hydrated
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-slate-400 text-lg">Loading Cloud Armor Command Center...</div>
      </div>
    );
  }

  // No data state - show URL input or upload
  if (rules.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* Simple Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <h1 className="text-xl font-bold text-white">Cloud Armor Command Center</h1>
          <p className="text-sm text-slate-400">Security Dashboard for GCP Projects</p>
        </header>

        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full">
            <div className="bg-slate-800 rounded-2xl border border-slate-600 p-8 shadow-2xl">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Database className="w-10 h-10 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Load Your Data</h2>
                <p className="text-slate-400">Connect to Google Sheets or upload a CSV file</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Google Sheets URL Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  <Link2 className="w-4 h-4 inline mr-2" />
                  Google Sheets URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={sheetURL}
                    onChange={(e) => setSheetURL(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="flex-1 px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => loadFromSheets()}
                    disabled={isLoading || !sheetURL.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <ExternalLink className="w-5 h-5" />
                    )}
                    Load
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Supported formats: /pubhtml, /pub?output=csv, or /edit URLs
                </p>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-slate-800 text-slate-500">OR</span>
                </div>
              </div>

              {/* CSV Upload */}
              <CSVUploader onUpload={handleCSVUpload} isLoading={isLoading} />

              {/* Expected columns */}
              <div className="mt-8 p-4 bg-slate-900 rounded-xl">
                <p className="text-xs font-semibold text-slate-400 mb-2">Expected CSV Columns:</p>
                <code className="text-xs text-cyan-400 leading-relaxed">
                  Project Name, Policy Name, Target Count, Adaptive Protection, Status, Match Expression, Rule Description, Priority
                </code>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div>
            <h1 className="text-xl font-bold text-white">Cloud Armor Command Center</h1>
            <p className="text-xs text-slate-400">
              {dataSource === 'sheets' ? '📊 Google Sheets' : '📄 CSV Upload'}
              {lastUpdated && <span className="ml-2">• Updated {lastUpdated.toLocaleTimeString()}</span>}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Change URL */}
            {sheetURL && (
              <button
                onClick={() => setShowURLInput(true)}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Change URL
              </button>
            )}

            {/* Refresh Button */}
            {dataSource === 'sheets' && sheetURL && (
              <button
                onClick={refreshFromSheets}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            )}

            {/* Upload CSV */}
            <CSVUploader onUpload={handleCSVUpload} isLoading={isLoading} compact />

            {/* Clear All */}
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm rounded-lg transition-colors border border-red-500/30"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>

        {/* URL Change Modal */}
        {showURLInput && (
          <div className="absolute left-0 right-0 top-full bg-slate-800 border-b border-slate-700 p-4 shadow-xl">
            <div className="max-w-3xl mx-auto flex gap-2">
              <input
                type="url"
                value={sheetURL}
                onChange={(e) => setSheetURL(e.target.value)}
                placeholder="Enter new Google Sheets URL"
                className="flex-1 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => loadFromSheets()}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg"
              >
                Load
              </button>
              <button
                onClick={() => setShowURLInput(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/20 border-b border-red-500/50 px-6 py-3">
          <div className="max-w-[1920px] mx-auto flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-300 text-sm flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white">✕</button>
          </div>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Quick Filters Sidebar */}
        <QuickFilters
          rules={rules}
          selectedProjects={selectedProjects}
          selectedActions={selectedActions}
          adaptiveFilter={adaptiveFilter}
          onProjectsChange={setSelectedProjects}
          onActionsChange={setSelectedActions}
          onAdaptiveChange={setAdaptiveFilter}
          onClearAll={resetFilters}
          filteredCount={filteredRules.length}
          totalCount={rules.length}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-[1600px] mx-auto space-y-6">
            {/* Query Builder */}
            <QueryBuilder
              onQueryChange={setAdvancedQuery}
              resultCount={filteredRules.length}
            />

            {/* KPI Cards */}
            <KPICards
              metrics={metrics}
              isLoading={isLoading}
              context={`${filteredRules.length.toLocaleString()} of ${rules.length.toLocaleString()} rules`}
            />

            {/* Charts */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <AttackVectorChart data={attackVectorData} isLoading={isLoading} />
              <ActionDistributionChart data={actionData} isLoading={isLoading} />
              <TopProjectsChart data={topProjects} isLoading={isLoading} />
            </section>

            {/* Master Ledger */}
            <MasterLedger
              data={filteredRules}
              isLoading={isLoading}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              searchQuery={quickSearch}
              onSearch={setQuickSearch}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
