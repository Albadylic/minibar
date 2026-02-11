import './App.css';
import { useGameState } from './hooks/useGameState';
import { useGameLoop } from './hooks/useGameLoop';
import GameBoard from './components/GameBoard';
import TitleScreen from './components/TitleScreen';
import GameOverScreen from './components/GameOverScreen';

function App() {
  const [state, dispatch] = useGameState();

  useGameLoop(
    (dt) => dispatch({ type: 'TICK', dt }),
    state.phase === 'playing'
  );

  switch (state.phase) {
    case 'title':
      return (
        <TitleScreen
          highScore={state.highScore}
          onStart={() => dispatch({ type: 'START_GAME' })}
        />
      );
    case 'playing':
      return <GameBoard state={state} dispatch={dispatch} />;
    case 'game_over':
      return (
        <GameOverScreen
          score={state.score}
          highScore={state.highScore}
          onRestart={() => dispatch({ type: 'START_GAME' })}
        />
      );
  }
}

export default App;
