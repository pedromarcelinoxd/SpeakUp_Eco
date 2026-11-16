/**
 * Mapa resumido (dashboard, detalhes).
 *
 * x-data="miniMap()"                                   → denúncias abertas + pontos
 * x-data="miniMap({ mode: 'single', coords, kind, item })" → um único marcador
 *
 * Objetos do Leaflet ficam fora do estado reativo do Alpine (closure),
 * pois proxies reativos quebram o Leaflet.
 */
import { createCluster, createMap, L, pointIcon, reportIcon, userIcon } from '../map/base';

export default (opts = {}) => {
    let map = null;
    let layer = null;

    return {
        init() {
            this.$nextTick(() => this.setup());
        },

        setup() {
            const single = opts.mode === 'single';
            map = createMap(this.$refs.map, {
                center: single ? opts.coords : this.$store.eco.origin,
                zoom: single ? 16 : 13,
                layer: this.$store.eco.settings.mapLayer,
                customControls: false,
            });
            map.scrollWheelZoom.disable();

            if (single) {
                const icon = opts.kind === 'point' ? pointIcon(opts.item, true) : reportIcon(opts.item, true);
                L.marker(opts.coords, { icon, keyboard: false }).addTo(map);
                return;
            }

            layer = createCluster().addTo(map);
            this.render();
            this.$watch('$store.eco.ready', () => this.render());
            this.$watch('$store.eco.settings.showDemo', () => this.render());

            if (this.$store.eco.location) {
                L.marker(this.$store.eco.location, { icon: userIcon(), interactive: false }).addTo(map);
            }
        },

        render() {
            if (!layer) return;
            layer.clearLayers();
            const eco = this.$store.eco;
            const go = (url) => () => { window.location.href = url; };
            eco.reports
                .filter((r) => ['recebida', 'em_analise', 'verificada'].includes(r.status))
                .forEach((r) => {
                    L.marker(r.coords, { icon: reportIcon(r), title: r.title })
                        .on('click', go(this.$u.route('report', r.id)))
                        .addTo(layer);
                });
            eco.points.forEach((p) => {
                L.marker(p.coords, { icon: pointIcon(p), title: p.name })
                    .on('click', go(this.$u.route('point', p.id)))
                    .addTo(layer);
            });
        },

        destroy() {
            map?.remove();
        },
    };
};
