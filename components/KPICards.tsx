'use client';

import { KPIMetrics } from '@/lib/types';
import { FolderKanban, Shield, ShieldCheck, AlertTriangle, FileText } from 'lucide-react';

interface KPICardsProps {
    metrics: KPIMetrics | null;
    isLoading: boolean;
    context?: string;
}

interface KPICardProps {
    title: string;
    value: number | string;
    subtitle: string;
    icon: React.ReactNode;
    color: 'blue' | 'purple' | 'green' | 'amber' | 'red';
    isLoading: boolean;
}

const colorClasses = {
    blue: {
        bg: 'from-blue-600/30 to-blue-600/10',
        border: 'border-blue-500/40',
        icon: 'bg-blue-600/30 text-blue-300',
        value: 'text-blue-300',
    },
    purple: {
        bg: 'from-purple-600/30 to-purple-600/10',
        border: 'border-purple-500/40',
        icon: 'bg-purple-600/30 text-purple-300',
        value: 'text-purple-300',
    },
    green: {
        bg: 'from-green-600/30 to-green-600/10',
        border: 'border-green-500/40',
        icon: 'bg-green-600/30 text-green-300',
        value: 'text-green-300',
    },
    amber: {
        bg: 'from-amber-600/30 to-amber-600/10',
        border: 'border-amber-500/40',
        icon: 'bg-amber-600/30 text-amber-300',
        value: 'text-amber-300',
    },
    red: {
        bg: 'from-red-600/30 to-red-600/10',
        border: 'border-red-500/40',
        icon: 'bg-red-600/30 text-red-300',
        value: 'text-red-300',
    },
};

function KPICard({ title, value, subtitle, icon, color, isLoading }: KPICardProps) {
    const colors = colorClasses[color];

    return (
        <div className={`relative bg-gradient-to-br ${colors.bg} rounded-xl border-2 ${colors.border} p-5 overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-lg`}>
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <div className={`${colors.icon} p-2.5 rounded-lg`}>
                        {icon}
                    </div>
                </div>

                <div className="space-y-1">
                    {isLoading ? (
                        <div className="h-9 w-20 bg-slate-700 rounded animate-pulse" />
                    ) : (
                        <p className={`text-3xl font-extrabold ${colors.value} tracking-tight`}>
                            {typeof value === 'number' ? value.toLocaleString() : value}
                        </p>
                    )}
                    <p className="text-white font-semibold">{title}</p>
                    <p className="text-slate-300 text-sm">{subtitle}</p>
                </div>
            </div>
        </div>
    );
}

export default function KPICards({ metrics, isLoading, context }: KPICardsProps) {
    return (
        <div className="space-y-2">
            {context && (
                <p className="text-sm text-slate-300 font-medium px-1">
                    📊 {context}
                </p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <KPICard
                    title="Projects"
                    value={metrics?.totalProjects ?? 0}
                    subtitle="GCP Projects"
                    icon={<FolderKanban className="w-5 h-5" />}
                    color="blue"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Policies"
                    value={metrics?.totalPolicies ?? 0}
                    subtitle="Cloud Armor"
                    icon={<Shield className="w-5 h-5" />}
                    color="purple"
                    isLoading={isLoading}
                />
                <KPICard
                    title="WAF Coverage"
                    value={metrics ? `${metrics.wafCoverage}%` : '0%'}
                    subtitle="Adaptive Protection"
                    icon={<ShieldCheck className="w-5 h-5" />}
                    color="green"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Critical Rules"
                    value={metrics?.criticalRules ?? 0}
                    subtitle="Priority < 1000"
                    icon={<AlertTriangle className="w-5 h-5" />}
                    color="amber"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Total Rules"
                    value={metrics?.totalRules ?? 0}
                    subtitle="All WAF Rules"
                    icon={<FileText className="w-5 h-5" />}
                    color="red"
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
}
