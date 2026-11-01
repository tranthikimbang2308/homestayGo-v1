import {
  AirVent,
  Car,
  Check,
  Coffee,
  Dog,
  Droplets,
  Flame,
  Mountain,
  Trees,
  Tv,
  CookingPot,
  Waves,
  WashingMachine,
  Wifi,
  Fence,
  Sailboat,
} from 'lucide-react';

const ICONS = {
  wifi: Wifi,
  ac: AirVent,
  kitchen: CookingPot,
  parking: Car,
  pool: Waves,
  tv: Tv,
  washer: WashingMachine,
  bbq: Flame,
  garden: Trees,
  balcony: Fence,
  hot_water: Droplets,
  pet: Dog,
  breakfast: Coffee,
  mountain_view: Mountain,
  sea_view: Sailboat,
};

export default function AmenityIcon({ name, className = 'h-5 w-5' }) {
  const Icon = ICONS[name] || Check;
  return <Icon className={className} />;
}
