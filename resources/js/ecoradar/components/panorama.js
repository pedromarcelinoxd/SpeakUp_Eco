/**
 * Panorama ambiental: indicadores, gráficos (Chart.js) e mapa de calor (leaflet.heat).
 * Chart.js e leaflet.heat são carregados sob demanda (code splitting).
 */
import { byCategory, byZone, dailySeries, inLastDays, kpis, monthlySeries } from '../analytics';
import { createMap, L } from '../map/base';

const FONT = '"Inter Variable", Inter, system-ui, sans-serif';
const GRID = 'rgba(32,42,39,.08)';
const MUTED = '#65726C';

export default () => {
    const charts = {};
    let Chart = null;
    let map = null;
    let heat = null;

    return {
        period: '365',
        loadingCharts: true,
        periods: { 30: '30 dias', 90: '90 dias', 365: '12 meses', all: 'Tudo' },

        async init() {
            const [{ default: ChartJS }] = await Promise.all([
                import('chart.js/auto'),
                import('leaflet.heat'),
            ]);
            Chart = ChartJS;
            Chart.defaults.font.family = FONT;
            Chart.defaults.font.size = 12;
            Chart.defaults.color = MUTED;
            Chart.defaults.plugins.tooltip.backgroundColor = '#202A27';
            Chart.defaults.plugins.tooltip.padding = 10;
            Chart.defaults.plugins.tooltip.cornerRadius = 10;
            Chart.defaults.plugins.tooltip.titleFont = { weight: '600', family: FONT };
            Chart.defaults.plugins.legend.labels.usePointStyle = true;
            Chart.defaults.plugins.legend.labels.boxWidth = 8;
            this.loadingCharts = false;

            this.$nextTick(() => {
                map = createMap(this.$refs.heatmap, { layer: 'light', customControls: false, zoom: 12 });
                map.scrollWheelZoom.disable();
                this.renderAll();
            });
            ['period', '$store.eco.ready', '$store.eco.settings.showDemo'].forEach((k) => this.$watch(k, () => this.renderAll()));
        },

        destroy() {
            Object.values(charts).forEach((c) => c.destroy());
            map?.remove();
        },

        get reports() {
            const all = this.$store.eco.reports;
            return this.period === 'all' ? all : inLastDays(all, Number(this.period));
        },

        get k() {
            return kpis(this.reports, this.$store.eco.points);
        },

        get categories() {
            return byCategory(this.reports);
        },

        get zones() {
            return byZone(this.reports);
        },

        get avgResolutionDays() {
            const resolved = this.reports.filter((r) => r.status === 'resolvida');
            const days = resolved.map((r) => {
                const end = r.history?.find((h) => h.status === 'resolvida')?.date;
                return end ? (new Date(end) - new Date(r.createdAt)) / 86400000 : null;
            }).filter((d) => d != null);
            return days.length ? (days.reduce((a, b) => a + b, 0) / days.length) : 0;
        },

        renderAll() {
            if (!Chart) return;
            this.renderCategory();
            this.renderTimeline();
            this.renderZones();
            this.renderRate();
            this.renderHeat();
        },

        upsert(key, canvas, config) {
            if (charts[key]) {
                charts[key].data = config.data;
                charts[key].update();
                return;
            }
            charts[key] = new Chart(canvas, config);
        },

        renderCategory() {
            const data = this.categories;
            this.upsert('category', this.$refs.catChart, {
                type: 'bar',
                data: {
                    labels: data.map((d) => d.label),
                    datasets: [{ data: data.map((d) => d.count), backgroundColor: data.map((d) => d.color), borderRadius: 6, barThickness: 18 }],
                },
                options: {
                    indexAxis: 'y',
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { color: GRID }, border: { display: false }, ticks: { precision: 0 } },
                        y: { grid: { display: false }, border: { display: false }, ticks: { color: '#202A27', font: { weight: '500' } } },
                    },
                },
            });
        },

        renderTimeline() {
            const short = this.period === '30' || this.period === '90';
            const series = short ? dailySeries(this.reports, Number(this.period), this.period === '90' ? 7 : 2) : monthlySeries(this.$store.eco.reports, 12);
            const ctx = this.$refs.timeChart.getContext('2d');
            const grad = ctx.createLinearGradient(0, 0, 0, 260);
            grad.addColorStop(0, 'rgba(231,122,91,.18)');
            grad.addColorStop(1, 'rgba(231,122,91,0)');
            this.upsert('time', this.$refs.timeChart, {
                type: 'line',
                data: {
                    labels: series.map((s) => s.label),
                    datasets: [
                        { label: 'Registradas', data: series.map((s) => s.created), borderColor: '#E77A5B', backgroundColor: grad, fill: true, tension: 0.35, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2.5 },
                        { label: 'Resolvidas', data: series.map((s) => s.resolved), borderColor: '#16A34A', backgroundColor: 'transparent', tension: 0.35, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2.5, borderDash: [] },
                    ],
                },
                options: {
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { legend: { position: 'top', align: 'end' } },
                    scales: {
                        x: { grid: { display: false }, border: { display: false } },
                        y: { grid: { color: GRID }, border: { display: false }, ticks: { precision: 0 }, beginAtZero: true },
                    },
                },
            });
        },

        renderZones() {
            const z = this.zones;
            this.upsert('zones', this.$refs.zoneChart, {
                type: 'bar',
                data: {
                    labels: z.map((d) => d.zone),
                    datasets: [
                        { label: 'Resolvidas', data: z.map((d) => d.resolved), backgroundColor: '#16A34A', borderRadius: 4, stack: 's' },
                        { label: 'Pendentes', data: z.map((d) => d.total - d.resolved), backgroundColor: '#D97706', borderRadius: 4, stack: 's' },
                    ],
                },
                options: {
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top', align: 'end' } },
                    scales: {
                        x: { stacked: true, grid: { display: false }, border: { display: false } },
                        y: { stacked: true, grid: { color: GRID }, border: { display: false }, ticks: { precision: 0 } },
                    },
                },
            });
        },

        renderRate() {
            const r = this.reports;
            const resolved = r.filter((x) => x.status === 'resolvida').length;
            const open = r.filter((x) => ['recebida', 'em_analise', 'verificada'].includes(x.status)).length;
            const rejected = r.filter((x) => x.status === 'nao_confirmada').length;
            this.upsert('rate', this.$refs.rateChart, {
                type: 'doughnut',
                data: {
                    labels: ['Resolvidas', 'Em andamento', 'Não confirmadas'],
                    datasets: [{ data: [resolved, open, rejected], backgroundColor: ['#16A34A', '#D97706', '#DCE2DC'], borderWidth: 0, hoverOffset: 4 }],
                },
                options: { maintainAspectRatio: false, cutout: '74%', plugins: { legend: { display: false } } },
            });
        },

        renderHeat() {
            if (!map) return;
            if (heat) map.removeLayer(heat);
            const pts = this.reports.map((r) => [r.coords[0], r.coords[1], r.severity === 'alta' ? 1 : r.severity === 'media' ? 0.7 : 0.45]);
            heat = L.heatLayer(pts, {
                radius: 28,
                blur: 22,
                maxZoom: 15,
                minOpacity: 0.35,
                gradient: { 0.2: '#BBF7D0', 0.45: '#FDE047', 0.7: '#F97316', 1: '#DC2626' },
            }).addTo(map);
        },
    };
};
