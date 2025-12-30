'use client';

import { useState, useMemo, useCallback } from 'react';
import { CloudArmorRule } from '@/lib/types';
import {
    Search, X, ChevronDown, ChevronUp, RotateCcw, Filter,
    Check, Square, Minus
} from 'lucide-react';

interface QuickFiltersProps {
    rules: CloudArmorRule[];
    selectedProjects: Set<string>;
    selectedActions: Set<string>;
    adaptiveFilter: 'all' | 'enabled' | 'disabled';
    onProjectsChange: (projects: Set<string>) => void;
    onActionsChange: (actions: Set<string>) => void;
    onAdaptiveChange: (filter: 'all' | 'enabled' | 'disabled') => void;
    onClearAll: () => void;
    filteredCount: number;
    totalCount: number;
}

interface FilterSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-slate-700/50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-700/30 transition-colors"
            >
                <span className="text-sm font-medium text-white">{title}</span>
                {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
            </button>
            {isOpen && <div className="px-4 pb-3">{children}</div>}
        </div>
    );
}

interface CheckboxItemProps {
    label: string;
    count: number;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

function CheckboxItem({ label, count, checked, onChange }: CheckboxItemProps) {
    return (
        <label className="flex items-center justify-between py-1.5 cursor-pointer hover:bg-slate-700/20 px-2 -mx-2 rounded">
            <div className="flex items-center gap-2">
                <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${checked
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-slate-500 hover:border-slate-400'
                        }`}
                    onClick={() => onChange(!checked)}
                >
                    {checked && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-slate-200">{label}</span>
            </div>
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full min-w-[28px] text-center">
                {count}
            </span>
        </label>
    );
}

export default function QuickFilters({
    rules,
    selectedProjects,
    selectedActions,
    adaptiveFilter,
    onProjectsChange,
    onActionsChange,
    onAdaptiveChange,
    onClearAll,
    filteredCount,
    totalCount,
}: QuickFiltersProps) {
    const [projectSearch, setProjectSearch] = useState('');

    // Calculate project counts
    const projectCounts = useMemo(() => {
        const counts = new Map<string, number>();
        rules.forEach(rule => {
            counts.set(rule.projectName, (counts.get(rule.projectName) || 0) + 1);
        });
        return counts;
    }, [rules]);

    // Calculate action counts
    const actionCounts = useMemo(() => {
        const counts = { deny: 0, allow: 0, throttle: 0, other: 0 };
        rules.forEach(rule => {
            const action = rule.status.toLowerCase();
            if (action.includes('deny')) counts.deny++;
            else if (action.includes('allow')) counts.allow++;
            else if (action.includes('throttle')) counts.throttle++;
            else counts.other++;
        });
        return counts;
    }, [rules]);

    // Calculate adaptive counts
    const adaptiveCounts = useMemo(() => {
        let enabled = 0, disabled = 0;
        rules.forEach(rule => {
            if (rule.adaptiveProtection) enabled++;
            else disabled++;
        });
        return { enabled, disabled };
    }, [rules]);

    // Filter projects by search
    const filteredProjects = useMemo(() => {
        const projects = Array.from(projectCounts.entries())
            .sort((a, b) => b[1] - a[1]);

        if (!projectSearch.trim()) return projects;

        const query = projectSearch.toLowerCase();
        return projects.filter(([name]) => name.toLowerCase().includes(query));
    }, [projectCounts, projectSearch]);

    // Toggle project selection
    const toggleProject = useCallback((project: string) => {
        const newSet = new Set(selectedProjects);
        if (newSet.has(project)) {
            newSet.delete(project);
        } else {
            newSet.add(project);
        }
        onProjectsChange(newSet);
    }, [selectedProjects, onProjectsChange]);

    // Toggle action selection
    const toggleAction = useCallback((action: string) => {
        const newSet = new Set(selectedActions);
        if (newSet.has(action)) {
            newSet.delete(action);
        } else {
            newSet.add(action);
        }
        onActionsChange(newSet);
    }, [selectedActions, onActionsChange]);

    // Select/deselect all projects
    const selectAllProjects = useCallback(() => {
        if (selectedProjects.size === projectCounts.size) {
            onProjectsChange(new Set());
        } else {
            onProjectsChange(new Set(projectCounts.keys()));
        }
    }, [selectedProjects.size, projectCounts, onProjectsChange]);

    const hasActiveFilters = selectedProjects.size > 0 || selectedActions.size > 0 || adaptiveFilter !== 'all';

    return (
        <aside className="w-72 bg-slate-800/50 border-r border-slate-700 flex flex-col h-[calc(100vh-57px)] sticky top-[57px]">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-400" />
                    <h2 className="text-sm font-semibold text-white">Quick Filters</h2>
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={onClearAll}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                        Clear all
                        <RotateCcw className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Results Count */}
            <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-700">
                <p className="text-xs text-slate-400">
                    Showing <span className="text-white font-medium">{filteredCount.toLocaleString()}</span> of{' '}
                    <span className="text-white font-medium">{totalCount.toLocaleString()}</span> rules
                </p>
            </div>

            {/* Scrollable Filters */}
            <div className="flex-1 overflow-y-auto">
                {/* Adaptive Protection */}
                <FilterSection title="Adaptive Protection">
                    <div className="space-y-1">
                        <CheckboxItem
                            label="Enabled"
                            count={adaptiveCounts.enabled}
                            checked={adaptiveFilter === 'enabled'}
                            onChange={() => onAdaptiveChange(adaptiveFilter === 'enabled' ? 'all' : 'enabled')}
                        />
                        <CheckboxItem
                            label="Disabled"
                            count={adaptiveCounts.disabled}
                            checked={adaptiveFilter === 'disabled'}
                            onChange={() => onAdaptiveChange(adaptiveFilter === 'disabled' ? 'all' : 'disabled')}
                        />
                    </div>
                </FilterSection>

                {/* Action Type */}
                <FilterSection title="Action Type">
                    <div className="space-y-1">
                        <CheckboxItem
                            label="Deny"
                            count={actionCounts.deny}
                            checked={selectedActions.has('deny')}
                            onChange={() => toggleAction('deny')}
                        />
                        <CheckboxItem
                            label="Allow"
                            count={actionCounts.allow}
                            checked={selectedActions.has('allow')}
                            onChange={() => toggleAction('allow')}
                        />
                        <CheckboxItem
                            label="Throttle"
                            count={actionCounts.throttle}
                            checked={selectedActions.has('throttle')}
                            onChange={() => toggleAction('throttle')}
                        />
                        {actionCounts.other > 0 && (
                            <CheckboxItem
                                label="Other"
                                count={actionCounts.other}
                                checked={selectedActions.has('other')}
                                onChange={() => toggleAction('other')}
                            />
                        )}
                    </div>
                </FilterSection>

                {/* Project ID */}
                <FilterSection title="Project ID">
                    {/* Project Search */}
                    <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={projectSearch}
                            onChange={(e) => setProjectSearch(e.target.value)}
                            className="w-full pl-8 pr-8 py-1.5 bg-slate-900 border border-slate-600 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                        {projectSearch && (
                            <button
                                onClick={() => setProjectSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {/* Select All */}
                    <button
                        onClick={selectAllProjects}
                        className="text-xs text-blue-400 hover:text-blue-300 mb-2"
                    >
                        {selectedProjects.size === projectCounts.size ? 'Deselect all' : 'Select all'}
                    </button>

                    {/* Project List */}
                    <div className="max-h-[300px] overflow-y-auto space-y-0.5">
                        {filteredProjects.length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-2">No projects found</p>
                        ) : (
                            filteredProjects.map(([project, count]) => (
                                <CheckboxItem
                                    key={project}
                                    label={project}
                                    count={count}
                                    checked={selectedProjects.has(project)}
                                    onChange={() => toggleProject(project)}
                                />
                            ))
                        )}
                    </div>
                </FilterSection>
            </div>
        </aside>
    );
}
