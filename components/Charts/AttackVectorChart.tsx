'use client';

import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    ChartOptions,
} from 'chart.js';
import { AttackVectorData } from '@/lib/types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface AttackVectorChartProps {
    data: AttackVectorData[];
    isLoading: boolean;
    title?: string;
}

export default function AttackVectorChart({ data, isLoading, title = 'Attack Vector Distribution' }: AttackVectorChartProps) {
    const totalRules = data.reduce((sum, item) => sum + item.count, 0);

    const chartData = {
        labels: data.map(d => d.label),
        datasets: [
            {
                data: data.map(d => d.count),
                backgroundColor: data.map(d => d.color + 'dd'),
                borderColor: data.map(d => d.color),
                borderWidth: 2,
                hoverBorderWidth: 3,
                hoverOffset: 8,
            },
        ],
    };

    const options: ChartOptions<'doughnut'> = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '55%',
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: '#e2e8f0',
                    font: {
                        size: 11,
                        weight: 'bold',
                    },
                    padding: 10,
                    usePointStyle: true,
                    pointStyle: 'circle',
                },
            },
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
                        const value = context.parsed ?? 0;
                        const percentage = totalRules > 0 ? ((value / totalRules) * 100).toFixed(1) : '0';
                        return ` ${value} rules (${percentage}%)`;
                    },
                },
            },
        },
    };

    if (isLoading) {
        return (
            <div className="bg-slate-800 rounded-xl border border-slate-600 p-6 h-[360px] shadow-lg">
                <div className="h-6 w-48 bg-slate-700 rounded animate-pulse mb-4" />
                <div className="h-[280px] flex items-center justify-center">
                    <div className="w-40 h-40 rounded-full bg-slate-700 animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-600 p-6 h-[360px] shadow-lg">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                {title}
            </h3>
            <div className="h-[280px]">
                {data.length > 0 ? (
                    <Doughnut data={chartData} options={options} />
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                        No data available
                    </div>
                )}
            </div>
        </div>
    );
}
