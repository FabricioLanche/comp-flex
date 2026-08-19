import type { TokenDef } from '../types';

interface Props {
  tokens: TokenDef[];
  onRemoveToken: (index: number) => void;
  onBack: () => void;
  onGenerate: () => void;
}

export default function TokenList({ tokens, onRemoveToken, onBack, onGenerate }: Props) {
  return (
    <>
      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-4">
        {/* Hatched divider */}
        <div className="h-2 bg-[repeating-linear-gradient(-45deg,transparent,transparent_2px,#3c3c3c_2px,#3c3c3c_3px)] rounded shrink-0" />

        {/* Token count */}
        <div className="text-[11px] text-text-muted text-center py-1">
          {tokens.length} token{tokens.length !== 1 ? 's' : ''} definido{tokens.length !== 1 ? 's' : ''}
        </div>

        {/* Token list */}
        <ul className="list-none flex-1 overflow-y-auto">
          {tokens.length === 0 && (
            <li className="text-center text-text-muted text-[13px] py-8">
              No hay tokens agregados.
            </li>
          )}
          {tokens.map((tok, i) => (
            <li
              key={i}
              className="flex items-center justify-between px-3.5 py-3 border border-border rounded-[10px] mb-1.5 text-[13px] bg-bg-surface transition-colors hover:bg-bg-hover"
            >
              <span className="flex-1 min-w-0">
                Token {i + 1}: <strong className="font-semibold text-text-primary">{tok.name}</strong>{' '}
                — <code className="font-mono text-xs text-text-secondary">{tok.pattern}</code>
              </span>
              <button
                title="Eliminar token"
                onClick={() => onRemoveToken(i)}
                className="shrink-0 w-[22px] h-[22px] rounded-full border-none bg-danger cursor-pointer ml-2.5 transition-opacity hover:opacity-70 relative"
              >
                <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">
                  ✕
                </span>
              </button>
            </li>
          ))}
        </ul>
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
          onClick={onGenerate}
          disabled={tokens.length === 0}
          className="flex-1 py-3.5 text-sm font-semibold font-[inherit] bg-accent border border-accent rounded-xl cursor-pointer text-white transition-all hover:bg-accent-hover hover:border-accent-hover active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Generar Scanner →
        </button>
      </div>
    </>
  );
}
