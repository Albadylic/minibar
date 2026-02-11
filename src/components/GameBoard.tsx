import { DRINKS } from '../constants';
import type { GameState, GameAction } from '../types';
import Bar from './Bar';
import Barrel from './Barrel';
import Customer from './Customer';
import Worker from './Worker';
import HUD from './HUD';

interface GameBoardProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export default function GameBoard({ state, dispatch }: GameBoardProps) {
  return (
    <div className="game-board">
      <HUD
        score={state.score}
        rating={state.rating}
        selectedDrink={state.selectedDrink}
      />
      <Bar />
      <div className="barrels-area">
        {DRINKS.map((drink) => (
          <Barrel
            key={drink.type}
            drinkType={drink.type}
            label={drink.label}
            color={drink.color}
            isSelected={state.selectedDrink === drink.type}
            onClick={() => dispatch({ type: 'SELECT_DRINK', drink: drink.type })}
          />
        ))}
      </div>
      {state.workers.map((worker) => (
        <Worker key={worker.id} worker={worker} />
      ))}
      {state.customers.map((customer) => (
        <Customer
          key={customer.id}
          customer={customer}
          onClick={() => dispatch({ type: 'SERVE_CUSTOMER', seatId: customer.seatId })}
        />
      ))}
    </div>
  );
}
