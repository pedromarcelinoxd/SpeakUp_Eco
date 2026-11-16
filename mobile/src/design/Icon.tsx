/**
 * Ícones Lucide — o mesmo conjunto do painel web, traço único de 2 px.
 * Nunca dentro de "quadradinhos" coloridos: o ícone acompanha o texto.
 */
import {
  ArrowLeft, ArrowRight, Award, Axe, BadgeCheck, BatteryCharging, Bell, BellOff, BrickWall, Calendar, Camera, Check, Cpu,
  ChevronLeft, ChevronRight, CircleCheck, CircleHelp, CircleX, Clock, Droplet, Droplets, Flag, Flame, Hourglass,
  ImagePlus, Inbox, Info, Layers, Leaf, Lightbulb, LocateFixed, LogOut, Mail, Map, MapPin, Medal, Navigation, Package,
  Pencil, Pill, Plus, Recycle, RefreshCw, Search, Send, Server, Share2, ShieldCheck, SlidersHorizontal, Smartphone,
  Sprout, Star, ThumbsDown, ThumbsUp, Trash2, Trees, TriangleAlert, Trophy, User, Users, Warehouse, WifiOff, X, Minus, ChevronDown,
} from 'lucide-react-native';
import { color } from './tokens';

export const ICONS = {
  'arrow-left': ArrowLeft, 'arrow-right': ArrowRight, award: Award, axe: Axe, 'badge-check': BadgeCheck,
  battery: BatteryCharging, bell: Bell, 'bell-off': BellOff, brick: BrickWall, camera: Camera, check: Check,
  'chevron-left': ChevronLeft, 'chevron-right': ChevronRight, 'circle-check': CircleCheck, help: CircleHelp,
  'circle-x': CircleX, clock: Clock, droplet: Droplet, droplets: Droplets, flag: Flag, flame: Flame,
  hourglass: Hourglass, 'image-plus': ImagePlus, inbox: Inbox, info: Info, layers: Layers, leaf: Leaf,
  bulb: Lightbulb, locate: LocateFixed, 'log-out': LogOut, mail: Mail, map: Map, pin: MapPin, medal: Medal,
  navigation: Navigation, package: Package, pencil: Pencil, pill: Pill, plus: Plus, recycle: Recycle,
  refresh: RefreshCw, search: Search, send: Send, server: Server, share: Share2, shield: ShieldCheck,
  sliders: SlidersHorizontal, phone: Smartphone, sprout: Sprout, star: Star, 'thumbs-up': ThumbsUp, trash: Trash2,
  trees: Trees, alert: TriangleAlert, trophy: Trophy, user: User, users: Users, warehouse: Warehouse,
  offline: WifiOff, x: X, cpu: Cpu, calendar: Calendar, 'thumbs-down': ThumbsDown, minus: Minus, 'chevron-down': ChevronDown,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20, tint = color.ink, strokeWidth = 2 }: {
  name: IconName; size?: number; tint?: string; strokeWidth?: number;
}) {
  const Cmp = ICONS[name];
  return <Cmp size={size} color={tint} strokeWidth={strokeWidth} />;
}
