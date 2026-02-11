import { WORKER_COLOR } from '../constants';
import type { BarWorker } from '../types';

interface WorkerProps {
  worker: BarWorker;
}

export default function Worker({ worker }: WorkerProps) {
  return (
    <div
      className="bar-worker"
      style={{
        left: `${worker.x}%`,
        top: `${worker.y}%`,
        background: WORKER_COLOR,
      }}
    />
  );
}
