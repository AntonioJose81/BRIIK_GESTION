
import React, { useMemo } from 'react';
import { Order, Store, AppSettings } from '../types';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

interface DashboardViewProps {
    orders: Order[];
    stores: Store[];
    settings: AppSettings;
    onClose: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ orders, stores, settings, onClose }) => {
    const stats = useMemo(() => {
        const revenueByStore: Record<string, number> = {};
        const revenueByDate: Record<string, number> = {};
        const qtyByType: Record<string, number> = {};
        const qtyByModel: Record<string, number> = {};
        const qtyByColor: Record<string, number> = {};
        let totalPVD = 0;
        let totalEquiv = 0;

        orders.forEach(order => {
            const store = stores.find(s => s.id === order.storeId);
            const storeName = store?.name || 'Tienda Eliminada';

            const orderSubtotal = order.lines.reduce((acc, l) => acc + (l.qty * l.pvdUnit), 0);
            const shipping = order.shippingOverride || orderSubtotal >= order.freeFromPVD ? 0 : order.shippingCost;
            const orderTotal = orderSubtotal + shipping;

            totalPVD += orderTotal;

            revenueByStore[storeName] = (revenueByStore[storeName] || 0) + orderTotal;
            revenueByDate[order.date] = (revenueByDate[order.date] || 0) + orderTotal;

            order.lines.forEach(line => {
                const lt = settings.lineTypes.find(t => t.codeType === line.type);
                totalEquiv += (line.qty * (lt?.equivalenceUnits || 1));
                qtyByType[lt?.label || line.type] = (qtyByType[lt?.label || line.type] || 0) + line.qty;

                if (line.model) {
                    const modelName = settings.models.find(m => m.code === line.model)?.name || line.model;
                    qtyByModel[modelName] = (qtyByModel[modelName] || 0) + line.qty;
                }
                if (line.color) {
                    const colorName = settings.colors.find(c => c.code === line.color)?.name || line.color;
                    qtyByColor[colorName] = (qtyByColor[colorName] || 0) + line.qty;
                }
            });
        });

        const sortedStores = Object.entries(revenueByStore)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const sortedDates = Object.entries(revenueByDate)
            .sort((a, b) => a[0].localeCompare(b[0]));

        const sortedModels = Object.entries(qtyByModel)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const sortedColors = Object.entries(qtyByColor)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        return {
            totalPVD,
            totalOrders: orders.length,
            totalEquiv,
            activeStores: stores.length,
            topStores: {
                labels: sortedStores.map(s => s[0]),
                values: sortedStores.map(s => s[1])
            },
            revenueTimeline: {
                labels: sortedDates.map(d => d[0]),
                values: sortedDates.map(d => d[1])
            },
            typeDistribution: {
                labels: Object.keys(qtyByType),
                values: Object.values(qtyByType)
            },
            topModels: {
                labels: sortedModels.map(m => m[0]),
                values: sortedModels.map(m => m[1])
            },
            topColors: {
                labels: sortedColors.map(c => c[0]),
                values: sortedColors.map(c => c[1])
            }
        };
    }, [orders, stores, settings]);

    const lineChartData = {
        labels: stats.revenueTimeline.labels,
        datasets: [
            {
                label: 'Ingresos PVD (€)',
                data: stats.revenueTimeline.values,
                borderColor: '#7C3AED',
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#7C3AED',
                pointBorderWidth: 2,
            },
        ],
    };

    const barChartData = {
        labels: stats.topStores.labels,
        datasets: [
            {
                label: 'Gasto Total (€)',
                data: stats.topStores.values,
                backgroundColor: [
                    '#7C3AED',
                    '#A78BFA',
                    '#C4B5FD',
                    '#DDD6FE',
                    '#EDE9FE',
                ],
                borderRadius: 12,
            },
        ],
    };

    const doughnutData = {
        labels: stats.typeDistribution.labels,
        datasets: [
            {
                data: stats.typeDistribution.values,
                backgroundColor: [
                    '#7C3AED',
                    '#F97316',
                    '#10B981',
                    '#3B82F6',
                    '#6366F1',
                ],
                borderWidth: 0,
                hoverOffset: 15,
            },
        ],
    };

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#1F2937',
                titleFont: { family: 'Rubik', size: 14, weight: 'bold' as const },
                bodyFont: { family: 'Nunito Sans', size: 13 },
                padding: 12,
                cornerRadius: 12,
                displayColors: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { display: true, color: 'rgba(0,0,0,0.03)' },
                ticks: { font: { family: 'Nunito Sans', weight: 'bold' as const }, color: '#9CA3AF' }
            },
            x: {
                grid: { display: false },
                ticks: { font: { family: 'Nunito Sans', weight: 'bold' as const }, color: '#9CA3AF' }
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Panel de Analítica</h2>
                    <p className="text-purple-300 font-bold uppercase tracking-widest text-xs mt-1">Visión global de negocio</p>
                </div>
                <button
                    onClick={onClose}
                    className="bg-white border border-purple-100 p-4 rounded-[1.5rem] text-primary font-black text-sm hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95"
                >
                    VOLVER AL CONTROL
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Facturación PVD', value: `${stats.totalPVD.toFixed(2)}€`, icon: '💰', color: 'bg-primary' },
                    { label: 'Pedidos Totales', value: stats.totalOrders, icon: '📦', color: 'bg-orange-500' },
                    { label: 'Capacidad (Eq.)', value: stats.totalEquiv, icon: '⚡', color: 'bg-emerald-500' },
                    { label: 'Tiendas Activas', value: stats.activeStores, icon: '🏬', color: 'bg-blue-500' },
                ].map((kpi, i) => (
                    <div key={i} className="bento-card flex items-center justify-between p-8">
                        <div>
                            <p className="text-[10px] font-black text-purple-300 uppercase tracking-[0.2em] mb-2">{kpi.label}</p>
                            <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{kpi.value}</h3>
                        </div>
                        <div className={`w-14 h-14 ${kpi.color} rounded-[1.25rem] flex items-center justify-center text-2xl text-white shadow-lg overflow-hidden relative`}>
                            <div className="absolute inset-0 bg-white/20 blur-md scale-150 -rotate-45 translate-y-8"></div>
                            {kpi.icon}
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Timeline */}
                <div className="lg:col-span-2 bento-card p-10 h-[500px] flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-black text-gray-900 text-xl tracking-tight">Evolución de Ingresos</h3>
                        <span className="bg-purple-50 text-primary text-[10px] font-black px-3 py-1 rounded-full border border-purple-100">POR DÍA</span>
                    </div>
                    <div className="flex-1">
                        <Line data={lineChartData} options={commonOptions} />
                    </div>
                </div>

                {/* Top Stores */}
                <div className="bento-card p-10 h-[500px] flex flex-col">
                    <h3 className="font-black text-gray-900 text-xl tracking-tight mb-8">Top Tiendas</h3>
                    <div className="flex-1">
                        <Bar
                            data={barChartData}
                            options={{
                                ...commonOptions,
                                indexAxis: 'y' as const,
                                scales: {
                                    ...commonOptions.scales,
                                    y: { ...commonOptions.scales.y, grid: { display: false } }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Product Mix */}
                <div className="bento-card p-10 flex flex-col">
                    <h3 className="font-black text-gray-900 text-xl tracking-tight mb-8">Mix de Productos</h3>
                    <div className="flex-1 min-h-[300px] relative">
                        <Doughnut
                            data={doughnutData}
                            options={{
                                ...commonOptions,
                                plugins: {
                                    ...commonOptions.plugins,
                                    legend: { display: true, position: 'bottom', labels: { font: { family: 'Nunito Sans', weight: 'bold' } } }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Top Models */}
                <div className="bento-card p-10 h-[500px] flex flex-col">
                    <h3 className="font-black text-gray-900 text-xl tracking-tight mb-8">Modelos Más Vendidos</h3>
                    <div className="flex-1">
                        <Bar
                            data={{
                                labels: stats.topModels.labels,
                                datasets: [{
                                    label: 'Unidades',
                                    data: stats.topModels.values,
                                    backgroundColor: '#10B981',
                                    borderRadius: 8
                                }]
                            }}
                            options={{
                                ...commonOptions,
                                indexAxis: 'y' as const,
                            }}
                        />
                    </div>
                </div>

                {/* Top Colors */}
                <div className="bento-card p-10 h-[500px] flex flex-col">
                    <h3 className="font-black text-gray-900 text-xl tracking-tight mb-8">Colores Más Vendidos</h3>
                    <div className="flex-1">
                        <Bar
                            data={{
                                labels: stats.topColors.labels,
                                datasets: [{
                                    label: 'Unidades',
                                    data: stats.topColors.values,
                                    backgroundColor: '#F97316',
                                    borderRadius: 8
                                }]
                            }}
                            options={{
                                ...commonOptions,
                                indexAxis: 'y' as const,
                            }}
                        />
                    </div>
                </div>

                {/* Detailed Insights / Logic info */}
                <div className="lg:col-span-3 bento-card p-10 bg-primary overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="m17 5-5-3-5 3" /><path d="m17 19-5 3-5-3" /><path d="M2 12h20" /><path d="m5 7-3 5 3 5" /><path d="m19 7 3 5-3 5" /></svg>
                    </div>
                    <div className="relative z-10 text-white max-w-lg">
                        <h3 className="text-3xl font-black tracking-tighter mb-4 leading-tight">Optimice su Cadena de Suministro</h3>
                        <p className="text-white/80 font-bold text-lg mb-8 leading-relaxed">
                            Basándonos en sus datos actuales, su capacidad logística ocupada es de <span className="text-white font-black underline">{stats.totalEquiv} unidades equivalentes</span>.
                            Considere ajustar sus reglas de MOQ si detecta pedidos pequeños recurrentes con altos costes de envío manual.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={onClose}
                                className="bg-white text-primary px-8 py-3 rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-all"
                            >
                                Glosario de Términos
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
