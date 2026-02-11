import { DRINKS } from '../constants';
import type { Customer } from '../types';

interface SpeechBubbleProps {
  customer: Customer;
}

function getUrgencyClass(customer: Customer): string {
  if (customer.status === 'leaving_angry') return 'timeout';
  if (customer.status === 'served_happy') return 'urgency-ok';
  if (customer.status === 'served_wrong') return 'urgency-red';

  const elapsed = 1 - customer.waitTimer / customer.maxWaitTime;
  if (elapsed > 0.9) return 'urgency-critical';
  if (elapsed > 0.75) return 'urgency-red';
  if (elapsed > 0.5) return 'urgency-orange';
  if (elapsed > 0.25) return 'urgency-warn';
  return 'urgency-ok';
}

function getBubbleContent(customer: Customer): string {
  if (customer.status === 'leaving_angry') return '\u2716';
  if (customer.status === 'served_happy') return '\u2714';
  if (customer.status === 'served_wrong') return '\u2716';

  const drink = DRINKS.find((d) => d.type === customer.drinkOrder);
  return drink?.label ?? '?';
}

export default function SpeechBubble({ customer }: SpeechBubbleProps) {
  const showBubble =
    customer.status === 'seated' ||
    customer.status === 'served_happy' ||
    customer.status === 'served_wrong' ||
    customer.status === 'leaving_angry';

  if (!showBubble) return null;

  return (
    <div className={`speech-bubble ${getUrgencyClass(customer)}`}>
      {getBubbleContent(customer)}
    </div>
  );
}
