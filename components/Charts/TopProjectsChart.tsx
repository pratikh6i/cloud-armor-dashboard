'use client';

import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
    ChartOptions,
} from 'chart.js';
import { ProjectPolicyCount } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface TopProjectsChartProps {
    data: ProjectPolicyCount[];
    isLoading: boolean;
}

export default function TopProjectsChart({ data, isLoading }: TopProjectsChartProps) {
    const colors = [
        '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
        '#06b6d4', '#ec4899', '#f97316', '#10b981', '#6366f1'
    ];

    const chartData = {
        labels: data.map(d => d.project.length > 25 ? d.project.slice(0, 25) + '...' : d.project),
        datasets: [
            {
                label: 'Policies',
                data: data.map(d => d.policyCount),
                backgroundColor: data.map((_, i) => colors[i % colors.length] + 'dd'),
                borderColor: data.map((_, i) => colors[i % colors.length]),
                borderWidth: 2,
                borderRadius: 4,
                borderSkipped: false,
            },
        ],
    };

    const options: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#ffffff',
                bodyColor: '#e2e8f0',
                borderColor: '#475569',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                titleFont: { size: 12, weight: 'bold' },
                bodyFont: { size: 11 },
                callbacks: {
                    title: (items) => {
                        const index = items[0]?.dataIndex;
                        return data[index]?.project || '';
                    },
                    label: (context) => ` ${context.parsed.x} policies`,
                },
            },
        },
        scales: {
            x: {
                grid: { color: '#475569' },
                ticks: { color: '#e2e8f0', font: { size: 10 } },
                border: { display: false },
            },
            y: {
                grid: { display: false },
                ticks: { color: '#ffffff', font: { size: 10, weight: 'bold' } },
                border: { display: false },
            },
        },
    };

    if (isLoading) {
        return (
            <div className="bg-slate-800 rounded-xl border border-slate-600 p-6 h-[360px] shadow-lg">
                <div className="h-6 w-48 bg-slate-700 rounded animate-pulse mb-4" />
                <div className="h-[280px] flex flex-col justify-around gap-2 py-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className="w-20 h-3 bg-slate-700 animate-pulse rounded" />
                            <div className="h-5 bg-slate-700 animate-pulse rounded" style={{ width: `${Math.random() * 40 + 20}%` }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-600 p-6 h-[360px] shadow-lg">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                Top {data.length} Projects
            </h3>
            <div className="h-[280px]">
                {data.length > 0 ? (
                    <Bar data={chartData} options={options} />
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                        No data available
                    </div>
                )}
            </div>
        </div>
    );
}
