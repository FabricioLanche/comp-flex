import { useState, useCallback } from 'react';
import type { TokenDef } from '../types';
import { scanTokens } from '../engine';

interface Props {
  tokens: TokenDef[];
  onBack: () => void;
  onReset: () => void;
}

export default function StringTester({ tokens, onBack, onReset }: Props) {
  const [testString, setTestString] = useState('');
  const [showTokens, setShowTokens] = useState(false);
  const [scanResult, setScanResult] = useState<string[] | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleScan = useCallback(async () => {
    if (!testString.trim() || tokens.length === 0) return;
    setLoading(true);
    setScanError(null);
    setScanResult(null);
    try {
      const result = await scanTokens(tokens, testString);
      setScanResult(result);
    } catch (e: unknown) {
      setScanError(e instanceof Error ? e.message : 'Error al escanear');
    } finally {
      setLoading(false);
    }
  }, [testString, tokens]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && testString.trim()) {
      handleScan();
    }
  };

  return (
    <>
      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-4">
        {/* Token summary */}
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setShowTokens(!showTokens)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left bg-bg-surface transition-colors hover:bg-bg-hover"
          >
            <span className="text-[11px] font-medium text-text-secondary">
              {tokens.length} token{tokens.length !== 1 ? 's' : ''} definido{tokens.length !== 1 ? 's' : ''}
            </span>
            <span className={`text-text-muted text-[10px] transition-transform duration-200 ${showTokens ? 'rotate-180' : ''}`}>
              ▾
            </span>
          </button>
          {showTokens && (
            <ul className="list-none border-t border-border bg-bg-deep max-h-36 overflow-y-auto">
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

        {/* String tester */}
        <div>
          <div className="text-[10px] font-medium tracking-[0.06em] uppercase text-text-secondary mb-1">
            Probar Scanner
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ingresá una cadena para probar..."
              value={testString}
              onChange={e => setTestString(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              className="flex-1 px-4 py-3.5 min-h-14 text-lg font-mono bg-bg-surface border border-border rounded-xl text-text-primary outline-none transition-colors focus:border-border-focus placeholder:text-text-muted"
            />
            <button
              onClick={handleScan}
              disabled={!testString.trim() || tokens.length === 0 || loading}
              title="Analizar"
              className="shrink-0 w-[46px] h-[46px] mt-auto rounded-full border border-border bg-bg-elevated cursor-pointer flex items-center justify-center text-base text-text-primary transition-all hover:bg-bg-hover hover:text-white active:scale-[0.94] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? '...' : '▶'}
            </button>
          </div>
        </div>

        {/* Scan results */}
        {scanError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-[12px] text-red-400 font-mono">
            {scanError}
          </div>
        )}
        {scanResult && scanResult.length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-bg-surface text-[10px] font-medium tracking-[0.06em] uppercase text-text-secondary">
              Resultado
            </div>
            <ul className="list-none bg-bg-deep max-h-48 overflow-y-auto">
              {scanResult.map((line, i) => {
                const isEnd = line.includes('TOKEN(END)');
                const isErr = line.includes('TOKEN(ERR');
                return (
                  <li
                    key={i}
                    className={`px-4 py-1.5 text-[12px] font-mono border-b border-border last:border-b-0 ${
                      isErr ? 'text-red-400' : isEnd ? 'text-text-muted' : 'text-green-400'
                    }`}
                  >
                    {line}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {scanResult && scanResult.length === 0 && (
          <div className="text-[12px] text-text-muted text-center py-2">
            No se encontraron tokens.
          </div>
        )}
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
