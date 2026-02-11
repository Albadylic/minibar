import { DRINKS, MAX_RATING } from '../constants';
import type { DrinkType } from '../types';

interface HUDProps {
  score: number;
  rating: number;
  selectedDrink: DrinkType | null;
}

export default function HUD({ score, rating, selectedDrink }: HUDProps) {
  const stars = [];
  for (let i = 1; i <= MAX_RATING; i++) {
    if (rating >= i) {
      stars.push(<span key={i} className="star filled">&#9733;</span>);
    } else if (rating >= i - 0.5) {
      stars.push(<span key={i} className="star half">&#9733;</span>);
    } else {
      stars.push(<span key={i} className="star">&#9733;</span>);
    }
  }

  const drinkInfo = selectedDrink
    ? DRINKS.find((d) => d.type === selectedDrink)
    : null;

  return (
    <div className="hud">
      <div className="hud-score">{score}</div>
      <div className="hud-rating">{stars}</div>
      <div className={`hud-drink ${drinkInfo ? 'has-drink' : ''}`}>
        {drinkInfo ? drinkInfo.label : 'No drink'}
      </div>
    </div>
  );
}
