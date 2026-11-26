import { useState } from 'react';
import { engine, type Channel, type EqBand } from '../../audio/engine';
import { useChannel } from '../../audio/useChannel';
import { Knob } from '../ui/Knob';
import { LevelMeter } from '../ui/LevelMeter';
import { Icon } from '../ui/Icon';
import './dj.css';

const fmtDb = (v: number) => (v <= -26 ? 'kill' : `${v > 0 ? '+' : ''}${v.toFixed(0)} dB`);
const BANDS: { band: EqBand; label: string }[] = [
  { band: 'high', label: 'Treble' },
  { band: 'mid', label: 'Mid' },
  { band: 'low', label: 'Bass' },
];

function Strip({ id, channel }: { id: 'A' | 'B'; channel: Channel }) {
  const st = useChannel(channel);
  const tone = id === 'A' ? 'pink' : 'blue';
  return (
    <div className={`strip strip--${id}`} role="group" aria-label={`Channel ${id}`}>
      <span className="strip__name pixel">{id}</span>
      {BANDS.map(({ band, label }) => (
        <Knob
          key={band}
          label={`Deck ${id} ${label}`}
          value={st.eq[band]}
          min={-26}
          max={6}
          step={1}
          defaultValue={0}
          tone={tone}
          format={fmtDb}
          onChange={(v) => channel.setEq(band, v)}
        />
      ))}
      <div className="strip__fader">
        <LevelMeter channel={channel} active={st.status === 'PLAYING'} label={`Deck ${id} level`} />
        <input
          type="range"
          className={`fader fader--vertical fader--${tone}`}
          min={0}
          max={1}
          step={0.01}
          value={st.volume}
          onChange={(e) => channel.setVolume(Number(e.target.value))}
          aria-label={`Deck ${id} volume`}
          aria-valuetext={`${Math.round(st.volume * 100)} percent`}
        />
      </div>
      <span className="strip__vol">{Math.round(st.volume * 100)}</span>
    </div>
  );
}

export function Mixer() {
  const a = useChannel(engine.A);
  const b = useChannel(engine.B);
  const anyPlaying = a.status === 'PLAYING' || b.status === 'PLAYING';
  const [xf, setXf] = useState(engine.getCrossfader());
  const [master, setMaster] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
  return (
    <section className="mixer" aria-label="Stereo mixer">
      <header className="mixer__head">
        <span className="pixel">Mixer</span>
        <div className="mixer__master">
        <LevelMeter channel={engine} active={anyPlaying} label="Master output level" />
        <Knob
          label="Master volume"
          value={master}
          min={-30}
          max={0}
          step={1}
          defaultValue={-1}
          tone="lilac"
          format={(v) => `${v} dB`}
          onChange={(v) => {
            setMaster(v);
            engine.setMasterDb(v);
          }}
        />
        </div>
        <button
          type="button"
          className="mixer__help"
          aria-expanded={showHelp}
          aria-controls="mixer-help"
          onClick={() => setShowHelp((s) => !s)}
        >
          <Icon name="info" className="icon icon--xs" /> How it works
        </button>
      </header>
      {showHelp && (
        <div id="mixer-help" className="mixer__helptext">
          <p>Everything here processes real audio with the Web Audio API: 3-band EQ (bass 220 Hz shelf, mid 1 kHz peak, treble 4.2 kHz shelf), channel volume, equal-power crossfader and live meters.</p>
          <p><strong>Cue</strong> sets / returns to a cue point. Separate headphone monitoring isn’t possible because browsers expose a single audio output.</p>
          <p><strong>Sync</strong> uses each track’s BPM from the catalogue (not detection).</p>
        </div>
      )}
      <div className="mixer__strips">
        <Strip id="A" channel={engine.A} />
        <Strip id="B" channel={engine.B} />
      </div>
      <div className="xfader">
        <span className="xfader__label pixel">A</span>
        <input
          type="range"
          className="fader fader--x"
          min={0}
          max={1}
          step={0.005}
          value={xf}
          onChange={(e) => {
            const v = Number(e.target.value);
            setXf(v);
            engine.setCrossfader(v);
          }}
          onDoubleClick={() => {
            setXf(0.5);
            engine.setCrossfader(0.5);
          }}
          aria-label="Crossfader"
          aria-valuetext={xf < 0.02 ? 'Full deck A' : xf > 0.98 ? 'Full deck B' : `${Math.round((1 - xf) * 100)} percent A, ${Math.round(xf * 100)} percent B`}
        />
        <span className="xfader__label pixel">B</span>
      </div>
    </section>
  );
}
