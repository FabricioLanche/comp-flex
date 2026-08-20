import { useState, useRef, useCallback, type KeyboardEvent } from 'react';
import type { TokenDef } from '../types';

const SYMBOL_BUTTONS = [
  { label: '[a-z]', insert: '[a-z]' },
  { label: '[A-Z]', insert: '[A-Z]' },
  { label: '[0-9]', insert: '[0-9]' },
  { label: '+',     insert: '+' },
  { label: '*',     insert: '*' },
  { label: '?',     insert: '?' },
  { label: 'or',    insert: 'or' },
  { label: '(',     insert: '(' },
  { label: ')',     insert: ')' },
] as const;

interface Props {
  tokens: TokenDef[];
  onAddToken: (name: string, pattern: string) => void;
  onNext: () => void;
}

export default function TokenConstructor({ tokens, onAddToken, onNext }: Props) {
  const [name, setName] = useState('');
  const [pattern, setPattern] = useState('');
  const [tokenCursor, setTokenCursor] = useState(0);
  const [showTokens, setShowTokens] = useState(false);
  const patternDisplayRef = useRef<HTMLDivElement>(null);

  const tokenize = useCallback((p: string): string[] => {
    const tokens: string[] = [];
    let i = 0;
    while (i < p.length) {
      if (p[i] === '[') {
        const close = p.indexOf(']', i + 1);
        if (close !== -1) { tokens.push(p.slice(i, close + 1)); i = close + 1; continue; }
      }
      if (p.slice(i, i + 2) === 'or') {
        tokens.push('or');
        i += 2;
        continue;
      }
      tokens.push(p[i]);
      i++;
    }
    return tokens;
  }, []);

  const tokensFromPattern = tokenize(pattern);

  const handleInsert = useCallback((symbol: string) => {
    const next = [...tokensFromPattern];
    next.splice(tokenCursor, 0, symbol);
    setPattern(next.join(''));
    setTokenCursor(tokenCursor + 1);
  }, [tokensFromPattern, tokenCursor]);

  const handleDelete = useCallback(() => {
    if (tokenCursor === 0) return;
    const next = [...tokensFromPattern];
    next.splice(tokenCursor - 1, 1);
    setPattern(next.join(''));
    setTokenCursor(tokenCursor - 1);
  }, [tokensFromPattern, tokenCursor]);

  const handleReset = () => {
    setPattern('');
    setTokenCursor(0);
  };

  const handleDisplayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (tokensFromPattern.length === 0) { setTokenCursor(0); return; }
    const el = patternDisplayRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const charWidth = 14.4;
    const clickChar = Math.round(clickX / charWidth);

    let accum = 0;
    let bestIdx = 0;
    let bestDist = Infinity;
    tokensFromPattern.forEach((tok, i) => {
      const mid = accum + tok.length / 2;
      const dist = Math.abs(clickChar - mid);
      if (dist < bestDist) { bestDist = dist; bestIdx = i + 1; }
      accum += tok.length;
    });
    setTokenCursor(bestIdx);
  }, [tokensFromPattern]);

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
    setTokenCursor(0);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const renderPattern = () => {
    if (tokensFromPattern.length === 0) {
      return <span className="text-text-muted">[a-z][a-z0-9]*</span>;
    }
    const before = tokensFromPattern.slice(0, tokenCursor).join('');
    const cursor = (
      <span className="inline-block w-[2px] h-[1.1em] bg-accent align-middle animate-pulse mx-px" />
    );
    const after = tokensFromPattern.slice(tokenCursor).join('');
    return (
      <>
        <span className="text-text-primary">{before}</span>
        {cursor}
        <span className="text-text-primary">{after}</span>
      </>
    );
  };

  return (
    <>
      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-4">
        {/* Token name */}
        <div>
          <div className="text-[10px] font-medium tracking-[0.06em] uppercase text-text-secondary mt-5 mb-1">
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

        {/* Pattern display — clickable */}
        <div className="relative">
          <div className="bg-bg-surface border border-border rounded-xl px-4 py-3.5 min-h-14 flex flex-col justify-center">
            <div className="text-[10px] font-medium tracking-[0.06em] uppercase text-text-secondary mb-1">
              Patrón
            </div>
            <div
              ref={patternDisplayRef}
              onClick={handleDisplayClick}
              className="font-mono text-lg min-h-6 break-all cursor-text select-none"
            >
              {renderPattern()}
            </div>
          </div>
          <div className="absolute top-2.5 right-2.5 flex gap-1">
            <button
              className="bg-transparent border border-border rounded-md w-[26px] h-[26px] flex items-center justify-center text-[13px] text-text-muted transition-all hover:bg-bg-hover hover:text-danger disabled:opacity-30"
              onClick={handleDelete}
              title="Borrar último carácter"
              disabled={tokensFromPattern.length === 0}
            >
              ⌫
            </button>
            <button
              className="bg-transparent border border-border rounded-md w-[26px] h-[26px] flex items-center justify-center text-[13px] text-text-muted transition-all hover:bg-bg-hover hover:text-text-secondary"
              onClick={handleReset}
              title="Reiniciar patrón"
            >
              ↺
            </button>
          </div>
        </div>

        {/* Registered tokens summary — floating overlay */}
        {tokens.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowTokens(!showTokens)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left bg-bg-surface border border-border rounded-xl transition-colors hover:bg-bg-hover"
            >
              <span className="text-[11px] font-medium text-text-secondary">
                {tokens.length} token{tokens.length !== 1 ? 's' : ''} registrado{tokens.length !== 1 ? 's' : ''}
              </span>
              <span className={`text-text-muted text-[10px] transition-transform duration-200 ${showTokens ? 'rotate-180' : ''}`}>
                ▾
              </span>
            </button>
            {showTokens && (
              <ul className="list-none absolute left-0 right-0 z-50 mt-1 border border-border rounded-xl bg-bg-deep shadow-[0_8px_32px_rgba(0,0,0,0.5)] max-h-48 overflow-y-auto">
                {tokens.map((tok, i) => (
                  <li
                    key={i}
                    className="flex items-center px-4 py-2 text-[12px] border-b border-border last:border-b-0 transition-colors hover:bg-bg-hover"
                  >
                    <strong className="text-text-primary font-semibold">{tok.name}</strong>
                    <code className="ml-2 font-mono text-text-muted">{tok.pattern}</code>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

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
