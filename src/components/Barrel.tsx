import type { DrinkType } from '../types';

interface BarrelProps {
  drinkType: DrinkType;
  label: string;
  color: string;
  isSelected: boolean;
  onClick: () => void;
}

export default function Barrel({ label, color, isSelected, onClick }: BarrelProps) {
  return (
    <div
      className={`barrel ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="barrel-keg" style={{ background: color }} />
      <span className="barrel-label">{label}</span>
    </div>
  );
}
