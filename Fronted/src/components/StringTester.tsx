import { useState } from 'react';
import type { TokenDef, ScanResult } from '../types';
import { runScanner } from '../engine';

interface Props {
  dfa: object | null;
  tokens: TokenDef[];
  onBack: () => void;
  onReset: () => void;
}

export default function StringTester({ dfa, tokens, onBack, onReset }: Props) {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<ScanResult[]>([]);

  const handleRun = () => {
    if (!dfa || !input) return;
    setResults(runScanner(dfa, input, tokens));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRun();
  };

  return (
    <>
      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-4">
        {/* Input display */}
        <div className="bg-bg-surface border border-border rounded-xl px-4 py-3.5 min-h-14 flex flex-col justify-center">
          <div className="text-[10px] font-medium tracking-[0.06em] uppercase text-text-secondary mb-1">
            cadena de entrada
          </div>
          <div className={`font-mono text-lg min-h-6 break-all ${input ? 'text-text-primary' : 'text-text-muted'}`}>
            {input || '...'}
          </div>
        </div>

        {/* Input + play button */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ingresa su cadena"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            className="flex-1 px-3.5 py-3 text-sm font-[inherit] bg-bg-surface border border-border rounded-[10px] text-text-primary outline-none transition-colors focus:border-border-focus placeholder:text-text-muted"
          />
          <button
            onClick={handleRun}
            title="Analizar"
            className="shrink-0 w-[46px] h-[46px] rounded-full border border-border bg-bg-elevated cursor-pointer flex items-center justify-center text-base text-text-primary transition-all hover:bg-bg-hover hover:text-white active:scale-[0.94]"
          >
            ▶
          </button>
        </div>

        {/* Results */}
        <div>
          <div className="text-[10px] font-medium tracking-[0.06em] uppercase text-text-secondary mb-1">
            Resultados
          </div>
          <ul className="list-none flex-1 overflow-y-auto">
            {results.length === 0 && (
              <li className="text-center text-text-muted text-[13px] py-8">
                Presioná ▶ para analizar
              </li>
            )}
            {results.map((r, i) => (
              <li
                key={i}
                className={`px-3.5 py-2.5 border rounded-[10px] mb-1.5 font-mono text-[13px] bg-bg-surface ${
                  r.type === 'error'
                    ? 'text-danger border-danger/30 bg-danger/10'
                    : 'border-border'
                }`}
              >
                {r.type === 'token'
                  ? `TOKEN(${r.name}, ${r.lexema})`
                  : `Error: '${r.char}' en posición ${r.position}`}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border shrink-0 flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 text-sm font-semibold font-[inherit] bg-transparent border border-border rounded-xl cursor-pointer text-text-muted transition-all hover:bg-bg-hover hover:text-text-secondary active:scale-[0.98]"
        >
          ← Volver
        </button>
        <button
          onClick={onReset}
          className="flex-1 py-3.5 text-sm font-semibold font-[inherit] bg-transparent border border-border rounded-xl cursor-pointer text-text-muted transition-all hover:bg-bg-hover hover:text-text-secondary active:scale-[0.98]"
        >
          Modificar Tokens
        </button>
      </div>
    </>
  );
}
