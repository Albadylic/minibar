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

function createWorkers(): BarWorker[] {
  return Array.from({ length: WORKER_COUNT }, (_, i) => {
    const barrel = BARREL_POSITIONS[i % BARREL_POSITIONS.length];
    return {
      id: i,
      x: barrel.x,
      y: barrel.y,
      targetX: barrel.x,
      targetY: barrel.y,
      phase: 'at_barrel' as const,
      pauseTimer: randomPause() + i * 0.6, // stagger initial departures
    };
  });
}

function pickBarTarget(customers: Customer[]): { x: number; y: number } {
  // Try to path toward a seated customer's service position
  const seated = customers.filter((c) => c.status === 'seated');
  if (seated.length > 0) {
    const pick = seated[Math.floor(Math.random() * seated.length)];
    return BAR_SERVICE_POSITIONS[pick.seatId];
  }
  // Fallback: random service position
  return BAR_SERVICE_POSITIONS[Math.floor(Math.random() * BAR_SERVICE_POSITIONS.length)];
}

function pickBarrelTarget(customers: Customer[]): { x: number; y: number } {
  // Try to pick the barrel matching the next waiting customer's drink
  const seated = customers.filter((c) => c.status === 'seated');
  if (seated.length > 0) {
    const pick = seated[Math.floor(Math.random() * seated.length)];
    const drinkIdx = DRINKS.findIndex((d) => d.type === pick.drinkOrder);
    if (drinkIdx >= 0) return BARREL_POSITIONS[drinkIdx];
  }
  return BARREL_POSITIONS[Math.floor(Math.random() * BARREL_POSITIONS.length)];
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

      // Apply rating changes
      let newRating = Math.min(MAX_RATING, Math.max(0, newState.rating + ratingDelta));

      // Check game over
      if (newRating <= 0) {
        const finalHighScore = Math.max(newState.score, newState.highScore);
        saveHighScore(finalHighScore);
        return {
          ...newState,
          phase: 'game_over',
          rating: 0,
          customers,
          highScore: finalHighScore,
        };
      }

      // Update workers
      const workers = newState.workers.map((w) => {
        const worker = { ...w };
        if (worker.phase === 'to_barrel' || worker.phase === 'to_bar') {
          const dx = worker.targetX - worker.x;
          const dy = worker.targetY - worker.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const step = WORKER_SPEED * dt;
          if (dist <= step) {
            worker.x = worker.targetX;
            worker.y = worker.targetY;
            worker.phase = worker.phase === 'to_barrel' ? 'at_barrel' : 'at_bar';
            worker.pauseTimer = randomPause();
          } else {
            worker.x += (dx / dist) * step;
            worker.y += (dy / dist) * step;
          }
        } else {
          worker.pauseTimer -= dt;
          if (worker.pauseTimer <= 0) {
            if (worker.phase === 'at_barrel') {
              const target = pickBarTarget(customers);
              worker.targetX = target.x;
              worker.targetY = target.y;
              worker.phase = 'to_bar';
            } else {
              const target = pickBarrelTarget(customers);
              worker.targetX = target.x;
              worker.targetY = target.y;
              worker.phase = 'to_barrel';
            }
          }
        }
        return worker;
      });

      // Spawn timing
      newState.timeSinceLastSpawn += dt;
      let stateAfterSpawn = {
        ...newState,
        customers,
        workers,
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

      const customerIdx = state.customers.findIndex(
        (c) => c.seatId === action.seatId && c.status === 'seated'
      );
      if (customerIdx === -1) return state;

      const customer = state.customers[customerIdx];
      const isCorrect = customer.drinkOrder === state.selectedDrink;

      const timeRatio = customer.waitTimer / customer.maxWaitTime;
      const isFast = timeRatio > FAST_SERVE_THRESHOLD;
      const points = isCorrect
        ? SCORE_PER_SERVE * (isFast ? FAST_SERVE_MULTIPLIER : 1)
        : 0;

      const ratingChange = isCorrect ? RATING_CORRECT : RATING_WRONG;
      let newRating = Math.min(MAX_RATING, Math.max(0, state.rating + ratingChange));

      const newCustomers = state.customers.map((c, i) =>
        i === customerIdx
          ? { ...c, status: isCorrect ? 'served_happy' as const : 'served_wrong' as const, walkProgress: 0 }
          : c
      );

      const newScore = state.score + points;

      // Check game over
      if (newRating <= 0) {
        const finalHighScore = Math.max(newScore, state.highScore);
        saveHighScore(finalHighScore);
        return {
          ...state,
          phase: 'game_over',
          score: newScore,
          rating: 0,
          customers: newCustomers,
          selectedDrink: null,
          highScore: finalHighScore,
        };
      }

      return {
        ...state,
        score: newScore,
        rating: newRating,
        customers: newCustomers,
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
