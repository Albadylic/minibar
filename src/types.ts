export type DrinkType = 'ale' | 'stout' | 'lager';

export type CustomerStatus =
  | 'walking_in'
  | 'seated'
  | 'served_happy'
  | 'served_wrong'
  | 'leaving_angry'
  | 'walking_out'
  | 'gone';

export interface SeatPosition {
  id: number;
  side: 'left' | 'front' | 'right';
  x: number; // percentage
  y: number; // percentage
  entryX: number; // percentage - where customer enters from
  entryY: number; // percentage
}

export interface Customer {
  id: number;
  seatId: number;
  drinkOrder: DrinkType;
  status: CustomerStatus;
  color: string;
  waitTimer: number;
  maxWaitTime: number;
  walkProgress: number; // 0 to 1
}

export type WorkerPhase = 'to_barrel' | 'at_barrel' | 'to_bar' | 'at_bar';

export interface BarWorker {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  phase: WorkerPhase;
  pauseTimer: number;
}

export type GamePhase = 'title' | 'playing' | 'game_over';

export interface GameState {
  phase: GamePhase;
  score: number;
  rating: number;
  highScore: number;
  selectedDrink: DrinkType | null;
  customers: Customer[];
  workers: BarWorker[];
  timeSinceLastSpawn: number;
  spawnInterval: number;
  elapsedTime: number;
  nextCustomerId: number;
}

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'TICK'; dt: number }
  | { type: 'SELECT_DRINK'; drink: DrinkType }
  | { type: 'SERVE_CUSTOMER'; seatId: number }
  | { type: 'GAME_OVER' };
