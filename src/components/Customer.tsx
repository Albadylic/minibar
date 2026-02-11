import { SEATS } from '../constants';
import type { Customer as CustomerType } from '../types';
import SpeechBubble from './SpeechBubble';

interface CustomerProps {
  customer: CustomerType;
  onClick: () => void;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export default function Customer({ customer, onClick }: CustomerProps) {
  const seat = SEATS.find((s) => s.id === customer.seatId);
  if (!seat) return null;

  let x: number;
  let y: number;

  switch (customer.status) {
    case 'walking_in': {
      x = lerp(seat.entryX, seat.x, customer.walkProgress);
      y = lerp(seat.entryY, seat.y, customer.walkProgress);
      break;
    }
    case 'walking_out': {
      x = lerp(seat.x, seat.entryX, customer.walkProgress);
      y = lerp(seat.y, seat.entryY, customer.walkProgress);
      break;
    }
    default: {
      x = seat.x;
      y = seat.y;
    }
  }

  const statusClass =
    customer.status === 'served_happy' ? 'served-happy' :
    customer.status === 'served_wrong' ? 'served-wrong' :
    customer.status === 'leaving_angry' ? 'leaving-angry' : '';

  return (
    <div
      className={`customer ${statusClass}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        background: customer.color,
      }}
      onClick={onClick}
    >
      <SpeechBubble customer={customer} />
    </div>
  );
}
