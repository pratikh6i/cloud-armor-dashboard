'use client';

import { ProjectAnalysis } from '@/lib/types';
import { X, Shield, ShieldAlert, ShieldCheck, Zap } from 'lucide-react';

interface ProjectDetailProps {
    project: ProjectAnalysis;
    onClose: () => void;
}

export default function ProjectDetail({ project, onClose }: ProjectDetailProps) {
    const formatProjectName = (name: string) => {
        return name.replace(/^awr-/, '').replace(/-test$/, '').replace(/-prod$/, '');
    };

    const wafCoverage = project.policyCount > 0
        ? Math.round((project.adaptiveProtectionCount / project.policyCount) * 100)
        : 0;

    return (
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm rounded-2xl border border-blue-500/30 p-6">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-blue-400 uppercase tracking-wider font-medium">
                            Project Analysis
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                        {formatProjectName(project.name)}
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">{project.name}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-slate-400 uppercase">Policies</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{project.policyCount}</p>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-slate-400 uppercase">WAF Coverage</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{wafCoverage}%</p>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-slate-400 uppercase">Deny Rules</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400">{project.denyRules}</p>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-slate-400 uppercase">Throttle</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">{project.throttleRules}</p>
                </div>
            </div>
        </div>
    );
}
