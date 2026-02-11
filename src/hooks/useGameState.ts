import { useReducer } from 'react';
import type { GameState, GameAction, Customer, DrinkType, BarWorker } from '../types';
import {
  SEATS,
  DRINKS,
  CUSTOMER_MAX_WAIT,
  INITIAL_SPAWN_INTERVAL,
  MIN_SPAWN_INTERVAL,
  WALK_DURATION,
  FEEDBACK_DURATION,
  INITIAL_RATING,
  MAX_RATING,
  RATING_CORRECT,
  RATING_WRONG,
  RATING_TIMEOUT,
  SCORE_PER_SERVE,
  FAST_SERVE_MULTIPLIER,
  FAST_SERVE_THRESHOLD,
  DIFFICULTY_RAMP_RATE,
  CUSTOMER_COLORS,
  WORKER_COUNT,
  WORKER_SPEED,
  WORKER_PAUSE_MIN,
  WORKER_PAUSE_MAX,
  BAR_SERVICE_POSITIONS,
  BARREL_POSITIONS,
} from '../constants';

const HIGH_SCORE_KEY = 'minibar_high_score';

function loadHighScore(): number {
  try {
    return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveHighScore(score: number) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    // ignore
  }
}

function randomPause(): number {
  return WORKER_PAUSE_MIN + Math.random() * (WORKER_PAUSE_MAX - WORKER_PAUSE_MIN);
}

function nearestBarrel(x: number, y: number): { x: number; y: number } {
  let best = BARREL_POSITIONS[0];
  let bestDist = Infinity;
  for (const b of BARREL_POSITIONS) {
    const d = (b.x - x) ** 2 + (b.y - y) ** 2;
    if (d < bestDist) { bestDist = d; best = b; }
  }
  return best;
}

function createWorkers(): BarWorker[] {
  return Array.from({ length: WORKER_COUNT }, (_, i) => {
    const barrel = BARREL_POSITIONS[i % BARREL_POSITIONS.length];
    return {
      id: i,
      x: barrel.x,
      y: barrel.y,
      targetX: barrel.x,
      targetY: barrel.y,
      phase: 'idle' as const,
      pauseTimer: 0,
      assignedSeatId: null,
      drinkCarried: null,
    };
  });
}

function createInitialState(): GameState {
  return {
    phase: 'title',
    score: 0,
    rating: INITIAL_RATING,
    highScore: loadHighScore(),
    selectedDrink: null,
    customers: [],
    workers: [],
    timeSinceLastSpawn: 0,
    spawnInterval: INITIAL_SPAWN_INTERVAL,
    elapsedTime: 0,
    nextCustomerId: 1,
  };
}

function randomDrink(): DrinkType {
  const types = DRINKS.map((d) => d.type);
  return types[Math.floor(Math.random() * types.length)];
}

function randomColor(): string {
  return CUSTOMER_COLORS[Math.floor(Math.random() * CUSTOMER_COLORS.length)];
}

function spawnCustomer(state: GameState): GameState {
  const occupiedSeats = new Set(
    state.customers
      .filter((c) => c.status !== 'gone')
      .map((c) => c.seatId)
  );
  const emptySeats = SEATS.filter((s) => !occupiedSeats.has(s.id));
  if (emptySeats.length === 0) return state;

  const seat = emptySeats[Math.floor(Math.random() * emptySeats.length)];
  const newCustomer: Customer = {
    id: state.nextCustomerId,
    seatId: seat.id,
    drinkOrder: randomDrink(),
    status: 'walking_in',
    color: randomColor(),
    waitTimer: CUSTOMER_MAX_WAIT,
    maxWaitTime: CUSTOMER_MAX_WAIT,
    walkProgress: 0,
  };

  return {
    ...state,
    customers: [...state.customers, newCustomer],
    nextCustomerId: state.nextCustomerId + 1,
    timeSinceLastSpawn: 0,
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      return {
        ...createInitialState(),
        phase: 'playing',
        highScore: state.highScore,
        workers: createWorkers(),
      };
    }

    case 'TICK': {
      if (state.phase !== 'playing') return state;

      const dt = action.dt;
      let newState = { ...state };
      newState.elapsedTime += dt;

      // Update spawn interval (difficulty ramp)
      newState.spawnInterval = Math.max(
        MIN_SPAWN_INTERVAL,
        INITIAL_SPAWN_INTERVAL - newState.elapsedTime * DIFFICULTY_RAMP_RATE
      );

      // Process customers
      let customers = newState.customers.map((c) => ({ ...c }));
      let ratingDelta = 0;

      for (const customer of customers) {
        switch (customer.status) {
          case 'walking_in': {
            customer.walkProgress = Math.min(1, customer.walkProgress + dt / WALK_DURATION);
            if (customer.walkProgress >= 1) {
              customer.status = 'seated';
            }
            break;
          }
          case 'seated': {
            customer.waitTimer -= dt;
            if (customer.waitTimer <= 0) {
              customer.status = 'leaving_angry';
              customer.walkProgress = 0;
              ratingDelta += RATING_TIMEOUT;
            }
            break;
          }
          case 'served_happy':
          case 'served_wrong': {
            // Wait for feedback animation then walk out
            customer.walkProgress += dt / FEEDBACK_DURATION;
            if (customer.walkProgress >= 1) {
              customer.status = 'walking_out';
              customer.walkProgress = 0;
            }
            break;
          }
          case 'leaving_angry': {
            // Brief pause showing X, then walk out
            customer.walkProgress += dt / FEEDBACK_DURATION;
            if (customer.walkProgress >= 1) {
              customer.status = 'walking_out';
              customer.walkProgress = 0;
            }
            break;
          }
          case 'walking_out': {
            customer.walkProgress = Math.min(1, customer.walkProgress + dt / WALK_DURATION);
            if (customer.walkProgress >= 1) {
              customer.status = 'gone';
            }
            break;
          }
        }
      }

      // Remove gone customers
      customers = customers.filter((c) => c.status !== 'gone');

      // Update workers
      const workers = newState.workers.map((w) => ({ ...w }));
      let scoreDelta = 0;

      // Invalidate assignments for customers who left or timed out
      for (const worker of workers) {
        if (worker.assignedSeatId !== null) {
          const still = customers.find(
            (c) => c.seatId === worker.assignedSeatId && c.status === 'seated'
          );
          if (!still) {
            worker.assignedSeatId = null;
            worker.drinkCarried = null;
            if (worker.phase === 'to_bar' || worker.phase === 'at_bar') {
              const barrel = nearestBarrel(worker.x, worker.y);
              worker.targetX = barrel.x;
              worker.targetY = barrel.y;
              worker.phase = 'returning';
            } else if (worker.phase === 'to_barrel' || worker.phase === 'at_barrel') {
              worker.phase = 'idle';
            }
          }
        }
      }

      // Move workers
      for (const worker of workers) {
        switch (worker.phase) {
          case 'idle':
            break;
          case 'to_barrel':
          case 'to_bar':
          case 'returning': {
            const dx = worker.targetX - worker.x;
            const dy = worker.targetY - worker.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const step = WORKER_SPEED * dt;
            if (dist <= step) {
              worker.x = worker.targetX;
              worker.y = worker.targetY;
              if (worker.phase === 'to_barrel') {
                worker.phase = 'at_barrel';
                worker.pauseTimer = randomPause();
              } else if (worker.phase === 'to_bar') {
                worker.phase = 'at_bar';
                worker.pauseTimer = randomPause();
              } else {
                worker.phase = 'idle';
              }
            } else {
              worker.x += (dx / dist) * step;
              worker.y += (dy / dist) * step;
            }
            break;
          }
          case 'at_barrel': {
            worker.pauseTimer -= dt;
            if (worker.pauseTimer <= 0 && worker.assignedSeatId !== null) {
              const service = BAR_SERVICE_POSITIONS[worker.assignedSeatId];
              worker.targetX = service.x;
              worker.targetY = service.y;
              worker.phase = 'to_bar';
            }
            break;
          }
          case 'at_bar': {
            worker.pauseTimer -= dt;
            if (worker.pauseTimer <= 0) {
              // Resolve the delivery
              if (worker.assignedSeatId !== null && worker.drinkCarried) {
                const custIdx = customers.findIndex(
                  (c) => c.seatId === worker.assignedSeatId && c.status === 'seated'
                );
                if (custIdx >= 0) {
                  const cust = customers[custIdx];
                  const isCorrect = cust.drinkOrder === worker.drinkCarried;
                  const timeRatio = cust.waitTimer / cust.maxWaitTime;
                  const isFast = timeRatio > FAST_SERVE_THRESHOLD;
                  if (isCorrect) {
                    scoreDelta += SCORE_PER_SERVE * (isFast ? FAST_SERVE_MULTIPLIER : 1);
                    ratingDelta += RATING_CORRECT;
                  } else {
                    ratingDelta += RATING_WRONG;
                  }
                  customers[custIdx] = {
                    ...cust,
                    status: isCorrect ? 'served_happy' : 'served_wrong',
                    walkProgress: 0,
                  };
                }
              }
              worker.assignedSeatId = null;
              worker.drinkCarried = null;
              const barrel = nearestBarrel(worker.x, worker.y);
              worker.targetX = barrel.x;
              worker.targetY = barrel.y;
              worker.phase = 'returning';
            }
            break;
          }
        }
      }

      // Apply rating and score changes (from both timeouts and worker deliveries)
      const newRating = Math.min(MAX_RATING, Math.max(0, newState.rating + ratingDelta));
      const newScore = newState.score + scoreDelta;

      // Check game over
      if (newRating <= 0) {
        const finalHighScore = Math.max(newScore, newState.highScore);
        saveHighScore(finalHighScore);
        return {
          ...newState,
          phase: 'game_over',
          score: newScore,
          rating: 0,
          customers,
          workers,
          highScore: finalHighScore,
        };
      }

      // Spawn timing
      newState.timeSinceLastSpawn += dt;
      let stateAfterSpawn = {
        ...newState,
        customers,
        workers,
        score: newScore,
        rating: newRating,
      };

      if (stateAfterSpawn.timeSinceLastSpawn >= stateAfterSpawn.spawnInterval) {
        stateAfterSpawn = spawnCustomer(stateAfterSpawn);
      }

      return stateAfterSpawn;
    }

    case 'SELECT_DRINK': {
      return {
        ...state,
        selectedDrink: state.selectedDrink === action.drink ? null : action.drink,
      };
    }

    case 'SERVE_CUSTOMER': {
      if (!state.selectedDrink || state.phase !== 'playing') return state;

      // Must have a seated customer at that seat
      const hasCustomer = state.customers.some(
        (c) => c.seatId === action.seatId && c.status === 'seated'
      );
      if (!hasCustomer) return state;

      // No worker already assigned to this seat
      if (state.workers.some((w) => w.assignedSeatId === action.seatId)) return state;

      // Find an idle worker
      const workerIdx = state.workers.findIndex((w) => w.phase === 'idle');
      if (workerIdx === -1) return state;

      // Dispatch the worker: barrel for the selected drink → bar service point
      const drinkIdx = DRINKS.findIndex((d) => d.type === state.selectedDrink);
      const barrel = drinkIdx >= 0 ? BARREL_POSITIONS[drinkIdx] : BARREL_POSITIONS[0];

      const newWorkers = state.workers.map((w, i) =>
        i === workerIdx
          ? {
              ...w,
              assignedSeatId: action.seatId,
              drinkCarried: state.selectedDrink,
              targetX: barrel.x,
              targetY: barrel.y,
              phase: 'to_barrel' as const,
            }
          : w
      );

      return {
        ...state,
        workers: newWorkers,
        selectedDrink: null,
      };
    }

    case 'GAME_OVER': {
      const finalHighScore = Math.max(state.score, state.highScore);
      saveHighScore(finalHighScore);
      return {
        ...state,
        phase: 'game_over',
        highScore: finalHighScore,
      };
    }

    default:
      return state;
  }
}

export function useGameState() {
  return useReducer(gameReducer, undefined, createInitialState);
}
