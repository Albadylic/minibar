import { SEATS } from '../constants';

export default function Bar() {
  return (
    <>
      <div className="bar-counter" />
      {SEATS.map((seat) => (
        <div
          key={seat.id}
          className="seat-marker"
          style={{ left: `${seat.x}%`, top: `${seat.y}%` }}
        />
      ))}
    </>
  );
}
