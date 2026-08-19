import { useState, useRef, type KeyboardEvent } from 'react';
import type { TokenDef } from '../types';

const SYMBOL_BUTTONS = [
  { label: '[a-z]', insert: '[a-z]' },
  { label: '[A-Z]', insert: '[A-Z]' },
  { label: '[0-9]', insert: '[0-9]' },
  { label: '+',     insert: '+' },
  { label: '*',     insert: '*' },
  { label: '?',     insert: '?' },
  { label: 'or',    insert: '|' },
] as const;

interface Props {
  tokens: TokenDef[];
  onAddToken: (name: string, pattern: string) => void;
  onNext: () => void;
}

export default function TokenConstructor({ tokens, onAddToken, onNext }: Props) {
  const [name, setName] = useState('');
  const [pattern, setPattern] = useState('');
  const patternRef = useRef<HTMLInputElement>(null);

  const handleInsert = (symbol: string) => {
    const input = patternRef.current;
    if (!input) return;

    const start = input.selectionStart ?? pattern.length;
    const end = input.selectionEnd ?? pattern.length;
    const next = pattern.slice(0, start) + symbol + pattern.slice(end);
    setPattern(next);

    requestAnimationFrame(() => {
      input.focus();
      const pos = start + symbol.length;
      input.setSelectionRange(pos, pos);
    });
  };

  const handleReset = () => {
    setPattern('');
    patternRef.current?.focus();
  };

  const handleAdd = () => {
    const trimmedName = name.trim();
    const trimmedPattern = pattern.trim();
    if (!trimmedName || !trimmedPattern) {
      alert('Completa el nombre y el patrón del token.');
      return;
    }
    onAddToken(trimmedName, trimmedPattern);
    setName('');
    setPattern('');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <>
      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-4">
        {/* Token name */}
        <div>
          <div className="text-[10px] font-medium tracking-[0.06em] uppercase text-text-secondary mb-1">
            Nombre del Token
          </div>
          <input
            type="text"
            placeholder="ID, NUM, IF, ..."
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            className="w-full px-3.5 py-3 text-sm font-[inherit] bg-bg-surface border border-border rounded-[10px] text-text-primary outline-none transition-colors focus:border-border-focus placeholder:text-text-muted"
          />
        </div>

        {/* Pattern display */}
        <div className="relative">
          <div className="bg-bg-surface border border-border rounded-xl px-4 py-3.5 min-h-14 flex flex-col justify-center">
            <div className="text-[10px] font-medium tracking-[0.06em] uppercase text-text-secondary mb-1">
              Patrón
            </div>
            <div className={`font-mono text-lg min-h-6 break-all ${pattern ? 'text-text-primary' : 'text-text-muted'}`}>
              {pattern || '[a-z][a-z0-9]*'}
            </div>
          </div>
          <button
            className="absolute top-2.5 right-2.5 bg-transparent border border-border rounded-md w-[26px] h-[26px] flex items-center justify-center text-[13px] text-text-muted transition-all hover:bg-bg-hover hover:text-text-secondary"
            onClick={handleReset}
            title="Reiniciar patrón"
          >
            ↺
          </button>
        </div>

        {/* Hidden input for cursor tracking */}
        <input
          ref={patternRef}
          type="text"
          value={pattern}
          readOnly
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
          aria-hidden="true"
        />

        {/* Symbol grid */}
        <div>
          <div className="text-[10px] font-medium tracking-[0.06em] uppercase text-text-secondary mb-1">
            Símbolos
          </div>
          <div className="grid grid-cols-4 gap-2">
            {SYMBOL_BUTTONS.map(btn => (
              <button
                key={btn.label}
                onClick={() => handleInsert(btn.insert)}
                className="py-4 text-[15px] font-mono font-medium bg-bg-elevated border border-border rounded-xl cursor-pointer text-text-primary transition-all hover:bg-bg-hover hover:text-white active:scale-[0.96]"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border shrink-0 flex flex-col gap-2">
        <button
          onClick={handleAdd}
          className="w-full py-3.5 text-sm font-semibold font-[inherit] bg-bg-elevated border border-border rounded-xl cursor-pointer text-text-primary transition-all hover:bg-bg-hover hover:text-white active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Agregar Token
        </button>
        <button
          onClick={onNext}
          disabled={tokens.length === 0}
          className="w-full py-3.5 text-sm font-semibold font-[inherit] bg-accent border border-accent rounded-xl cursor-pointer text-white transition-all hover:bg-accent-hover hover:border-accent-hover active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Siguiente →
        </button>
      </div>
    </>
  );
}
