/**
 * Ícones Lucide usados pelo EcoRadar.
 *
 * Importamos apenas os ícones necessários (tree-shaking) e expomos:
 *  - iconSvg(name, cls)  → string SVG (para marcadores do Leaflet e x-html)
 *  - diretiva Alpine x-icon="'nome'" → renderiza o SVG dentro do elemento
 */
import {
    Activity, ArrowLeft, ArrowRight, ArrowUpRight, Award, Axe, BadgeCheck, BatteryCharging, Bell, BellOff,
    BellRing, Building2, Calendar, Camera, ChartColumn, ChartLine, ChartPie, Check, CheckCheck, ChevronDown,
    ChevronLeft, ChevronRight, ChevronUp, CircleAlert, CircleCheck, CircleDot, CircleHelp, CircleX, Clock,
    CloudUpload, Compass, Construction, Copy, Cpu, Crown, Crosshair, Database, Droplet, Droplets, Ellipsis,
    ExternalLink, Eye, EyeOff, Ban, Palette, UserCheck, Filter, Flag, Flame, Footprints, Gauge, Globe, HandHeart, History, Hourglass, House,
    Image, ImagePlus, Inbox, Info, KeyRound, Layers, LayoutDashboard, LayoutGrid, Leaf, Lightbulb, List,
    LoaderCircle, LocateFixed, Lock, LogIn, LogOut, Mail, Map, MapPin, MapPinned, Maximize2, Medal, Megaphone,
    Menu, MessageSquare, Minimize2, Minus, MonitorSmartphone, MousePointerClick, Navigation, Package,
    PanelLeftClose, PanelLeftOpen, PartyPopper, Pencil, Phone, Pill, Plus, Radar, Recycle, RefreshCw, Route,
    Satellite, Search, Send, Server, Settings, Share2, Shield, ShieldCheck, SlidersHorizontal, Sparkles, Sprout,
    Star, Sun, Table, Target, Trash2, TreePine, Trees, TrendingDown, TrendingUp, TriangleAlert, Trophy, User,
    ThumbsUp, UserPlus, Users, Warehouse, Waves, WifiOff, X, Zap,
} from 'lucide';

const registry = {
    activity: Activity, 'arrow-left': ArrowLeft, 'arrow-right': ArrowRight, 'arrow-up-right': ArrowUpRight,
    award: Award, axe: Axe, 'badge-check': BadgeCheck, 'battery-charging': BatteryCharging, bell: Bell,
    'bell-off': BellOff, 'bell-ring': BellRing, building: Building2, calendar: Calendar, camera: Camera,
    'chart-column': ChartColumn, 'chart-line': ChartLine, 'chart-pie': ChartPie, check: Check,
    'check-check': CheckCheck, 'chevron-down': ChevronDown, 'chevron-left': ChevronLeft,
    'chevron-right': ChevronRight, 'chevron-up': ChevronUp, 'circle-alert': CircleAlert,
    'circle-check': CircleCheck, cpu: Cpu, 'circle-dot': CircleDot, 'circle-help': CircleHelp, 'circle-x': CircleX,
    clock: Clock, 'cloud-upload': CloudUpload, compass: Compass, construction: Construction, copy: Copy,
    crown: Crown, crosshair: Crosshair, database: Database, droplet: Droplet, droplets: Droplets,
    ellipsis: Ellipsis, 'external-link': ExternalLink, eye: Eye, filter: Filter, flag: Flag, flame: Flame,
    footprints: Footprints, gauge: Gauge, globe: Globe, 'hand-heart': HandHeart, history: History,
    hourglass: Hourglass, house: House, image: Image, 'image-plus': ImagePlus, inbox: Inbox, info: Info,
    'key-round': KeyRound, layers: Layers, 'layout-dashboard': LayoutDashboard, 'layout-grid': LayoutGrid,
    leaf: Leaf, lightbulb: Lightbulb, list: List, loader: LoaderCircle, 'locate-fixed': LocateFixed, lock: Lock,
    'log-in': LogIn, 'log-out': LogOut, mail: Mail, map: Map, 'map-pin': MapPin, 'map-pinned': MapPinned,
    maximize: Maximize2, medal: Medal, megaphone: Megaphone, menu: Menu, message: MessageSquare,
    minimize: Minimize2, minus: Minus, 'monitor-smartphone': MonitorSmartphone, 'mouse-pointer': MousePointerClick,
    navigation: Navigation, package: Package, 'panel-left-close': PanelLeftClose,
    'panel-left-open': PanelLeftOpen, 'party-popper': PartyPopper, pencil: Pencil, phone: Phone, pill: Pill,
    plus: Plus, radar: Radar, recycle: Recycle, refresh: RefreshCw, route: Route, satellite: Satellite,
    search: Search, send: Send, server: Server, settings: Settings, share: Share2, shield: Shield,
    'shield-check': ShieldCheck, 'eye-off': EyeOff, ban: Ban, palette: Palette, 'user-check': UserCheck, sliders: SlidersHorizontal, sparkles: Sparkles, sprout: Sprout, star: Star,
    sun: Sun, table: Table, target: Target, trash: Trash2, 'tree-pine': TreePine, trees: Trees,
    'thumbs-up': ThumbsUp, 'trending-down': TrendingDown, 'trending-up': TrendingUp, 'triangle-alert': TriangleAlert, trophy: Trophy,
    user: User, 'user-plus': UserPlus, users: Users, warehouse: Warehouse, waves: Waves, 'wifi-off': WifiOff,
    x: X, zap: Zap,
};

function attrsToString(attrs) {
    return Object.entries(attrs)
        .map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`)
        .join(' ');
}

function nodeToString([tag, attrs = {}, children = []]) {
    const inner = (children || []).map(nodeToString).join('');
    return `<${tag} ${attrsToString(attrs)}>${inner}</${tag}>`;
}

/**
 * Retorna o SVG de um ícone como string.
 */
export function iconSvg(name, cls = '', extra = {}) {
    const node = registry[name] || registry['circle-help'];
    // Formato lucide: ['svg', attrs, children]  (versões recentes)
    const [tag, attrs, children] = Array.isArray(node[0]) ? ['svg', {}, node] : node;
    const merged = {
        xmlns: 'http://www.w3.org/2000/svg',
        width: 24,
        height: 24,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': 2,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        ...attrs,
        'aria-hidden': 'true',
        focusable: 'false',
        ...extra,
    };
    if (cls) merged.class = cls;
    return nodeToString([tag, merged, children]);
}

/**
 * Diretiva Alpine: <span x-icon="'map'" class="h-4 w-4"></span>
 * O SVG herda o tamanho do elemento (w-full h-full).
 */
export function registerIconDirective(Alpine) {
    Alpine.directive('icon', (el, { expression }, { effect, evaluateLater }) => {
        const getName = evaluateLater(expression);
        el.classList.add('er-icon');
        effect(() => {
            getName((name) => {
                el.innerHTML = iconSvg(name, 'h-full w-full');
            });
        });
    });
}
