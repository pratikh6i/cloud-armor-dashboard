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
import { ActionDistributionData } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface ActionDistributionChartProps {
    data: ActionDistributionData[];
    isLoading: boolean;
    title?: string;
}

export default function ActionDistributionChart({ data, isLoading, title = 'Action Distribution' }: ActionDistributionChartProps) {
    const totalRules = data.reduce((sum, item) => sum + item.count, 0);

    const chartData = {
        labels: data.map(d => d.action.toUpperCase()),
        datasets: [
            {
                label: 'Rules',
                data: data.map(d => d.count),
                backgroundColor: data.map(d => d.color + 'dd'),
                borderColor: data.map(d => d.color),
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            },
        ],
    };

    const options: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'x',
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
                titleFont: { size: 13, weight: 'bold' },
                bodyFont: { size: 12 },
                callbacks: {
                    title: (items) => items[0]?.label || '',
                    label: (context) => {
                        const value = context.parsed.y ?? 0;
                        const percentage = totalRules > 0 ? ((value / totalRules) * 100).toFixed(1) : '0';
                        return ` ${value} rules (${percentage}%)`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#e2e8f0', font: { size: 11, weight: 'bold' } },
                border: { display: false },
            },
            y: {
                grid: { color: '#475569' },
                ticks: { color: '#e2e8f0', font: { size: 10 } },
                border: { display: false },
            },
        },
    };

    if (isLoading) {
        return (
            <div className="bg-slate-800 rounded-xl border border-slate-600 p-6 h-[360px] shadow-lg">
                <div className="h-6 w-48 bg-slate-700 rounded animate-pulse mb-4" />
                <div className="h-[280px] flex items-end justify-around gap-4 px-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="w-20 bg-slate-700 animate-pulse rounded-t" style={{ height: `${Math.random() * 60 + 30}%` }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-600 p-6 h-[360px] shadow-lg">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                {title}
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
