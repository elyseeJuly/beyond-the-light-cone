import { useState, useCallback, useRef, useEffect } from 'react';

interface Floater {
  id: number;
  value: number;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFloatingText = () => {
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const addFloater = useCallback((value: number) => {
    if (value === 0) return;
    const id = Date.now() + Math.random();
    setFloaters((prev) => [...prev, { id, value }]);
    
    const timer = setTimeout(() => {
      setFloaters((prev) => prev.filter((f) => f.id !== id));
      timersRef.current.delete(id);
    }, 1500);
    timersRef.current.set(id, timer);
  }, []);

  return { addFloater, floaters };
};

export const FloatingLayer: React.FC<{ floaters: Floater[] }> = ({ floaters }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {floaters.map((f) => (
      <div
        key={f.id}
        className={`absolute animate-float-up text-sm font-bold ${
          f.value >= 0 ? 'text-green-400' : 'text-orange-500'
        }`}
        style={{ 
          left: '50%', 
          top: '40%',
          transform: 'translateX(-50%)'
        }}
      >
        {f.value >= 0 ? `+${f.value}` : f.value}
      </div>
    ))}
  </div>
);
