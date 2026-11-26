import { useState } from 'react';
import { engine } from '../../audio/engine';
import { albumById, albums } from '../../data/albums';
import { Deck } from './Deck';
import { Mixer } from './Mixer';
import { TrackPicker } from './TrackPicker';
import './dj.css';

export function DJMode({ pickedId }: { pickedId: string }) {
  const [target, setTarget] = useState<'A' | 'B' | null>(null);
  return (
    <div className="dj">
      <Deck id="A" channel={engine.A} other={engine.B} onLoad={() => setTarget('A')} />
      <Mixer />
      <Deck id="B" channel={engine.B} other={engine.A} onLoad={() => setTarget('B')} />
      <TrackPicker
        target={target}
        albums={albums}
        pickedId={pickedId}
        onClose={() => setTarget(null)}
        onPick={(id) => {
          if (target) void engine[target].load(albumById(id));
          setTarget(null);
        }}
      />
    </div>
  );
}
