'use client';

import { useState, useMemo } from 'react';
import { ProjectAnalysis } from '@/lib/types';
import { Search, FolderKanban, ChevronRight, X, LayoutDashboard, Shield, ShieldAlert } from 'lucide-react';

interface ProjectSidebarProps {
    projects: ProjectAnalysis[];
    selectedProject: string | null;
    onSelectProject: (name: string | null) => void;
    searchQuery: string;
    onSearch: (query: string) => void;
}

export default function ProjectSidebar({
    projects,
    selectedProject,
    onSelectProject,
}: ProjectSidebarProps) {
    const [sidebarSearch, setSidebarSearch] = useState('');

    const filteredProjects = useMemo(() => {
        if (!sidebarSearch.trim()) return projects;
        const query = sidebarSearch.toLowerCase();
        return projects.filter(p => p.name.toLowerCase().includes(query));
    }, [projects, sidebarSearch]);

    const totalPolicies = projects.reduce((sum, p) => sum + p.policyCount, 0);
    const totalRules = projects.reduce((sum, p) => sum + p.ruleCount, 0);
    const totalDeny = projects.reduce((sum, p) => sum + p.denyRules, 0);

    return (
        <aside className="w-64 bg-slate-800/30 border-r border-slate-700 flex flex-col h-[calc(100vh-57px)] sticky top-[57px]">
            {/* Header */}
            <div className="p-3 border-b border-slate-700">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Projects ({projects.length})
                    </h2>
                    {selectedProject && (
                        <button
                            onClick={() => onSelectProject(null)}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                            <LayoutDashboard className="w-3 h-3" />
                            All
                        </button>
                    )}
                </div>

                {/* Sidebar Search */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Filter projects..."
                        value={sidebarSearch}
                        onChange={(e) => setSidebarSearch(e.target.value)}
                        className="w-full pl-8 pr-7 py-1.5 bg-slate-900/50 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                    {sidebarSearch && (
                        <button
                            onClick={() => setSidebarSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-1.5 space-y-0.5">
                    {/* All Projects Option */}
                    <button
                        onClick={() => onSelectProject(null)}
                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors ${!selectedProject
                                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                : 'text-slate-300 hover:bg-slate-700/50'
                            }`}
                    >
                        <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium">All Projects</p>
                            <p className="text-[10px] text-slate-400">
                                {totalPolicies} policies • {totalRules} rules
                            </p>
                        </div>
                    </button>

                    {/* Individual Projects */}
                    {filteredProjects.map((project) => (
                        <button
                            key={project.name}
                            onClick={() => onSelectProject(project.name)}
                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors ${selectedProject === project.name
                                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                    : 'text-slate-300 hover:bg-slate-700/50'
                                }`}
                        >
                            <FolderKanban className="w-4 h-4 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate" title={project.name}>
                                    {project.name}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <span className="flex items-center gap-0.5">
                                        <Shield className="w-2.5 h-2.5" />
                                        {project.policyCount}
                                    </span>
                                    <span className="flex items-center gap-0.5">
                                        <ShieldAlert className="w-2.5 h-2.5 text-red-400" />
                                        {project.denyRules}
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-transform ${selectedProject === project.name ? 'rotate-90' : ''
                                }`} />
                        </button>
                    ))}

                    {filteredProjects.length === 0 && (
                        <div className="text-center py-6 text-slate-400 text-xs">
                            No projects match "{sidebarSearch}"
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Stats */}
            <div className="p-2 border-t border-slate-700 bg-slate-800/50">
                <div className="grid grid-cols-2 gap-1.5 text-center text-[10px]">
                    <div className="p-1.5 bg-slate-900/50 rounded-lg">
                        <p className="text-slate-400">Rules</p>
                        <p className="text-white font-semibold text-sm">{totalRules.toLocaleString()}</p>
                    </div>
                    <div className="p-1.5 bg-slate-900/50 rounded-lg">
                        <p className="text-slate-400">Deny</p>
                        <p className="text-red-400 font-semibold text-sm">{totalDeny.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
