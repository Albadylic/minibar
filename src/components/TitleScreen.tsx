interface TitleScreenProps {
  highScore: number;
  onStart: () => void;
}

export default function TitleScreen({ highScore, onStart }: TitleScreenProps) {
  return (
    <div className="screen">
      <h1>MINIBAR</h1>
      <p>
        Serve drinks to thirsty customers before they lose patience!
        Click a barrel to pick a drink, then click a customer to serve them.
      </p>
      <button className="btn" onClick={onStart}>
        Start
      </button>
      {highScore > 0 && (
        <p className="high-score">High Score: {highScore}</p>
      )}
    </div>
  );
}
