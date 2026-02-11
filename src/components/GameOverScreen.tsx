interface GameOverScreenProps {
  score: number;
  highScore: number;
  onRestart: () => void;
}

export default function GameOverScreen({ score, highScore, onRestart }: GameOverScreenProps) {
  const isNewHigh = score >= highScore && score > 0;

  return (
    <div className="screen">
      <h2>Game Over</h2>
      <div className="final-score">{score}</div>
      {isNewHigh && <p>New High Score!</p>}
      <p className="high-score">Best: {highScore}</p>
      <button className="btn" onClick={onRestart}>
        Play Again
      </button>
    </div>
  );
}
