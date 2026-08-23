import { useState } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { CodeFile } from '../types';

SyntaxHighlighter.registerLanguage('cpp', cpp);

interface Props {
  files: CodeFile[];
}

export default function CodePreview({ files }: Props) {
  const defaultIdx = files.findIndex(f => f.name === 'scanner.cpp');
  const [activeTab, setActiveTab] = useState(defaultIdx >= 0 ? defaultIdx : 0);

  if (files.length === 0) {
    return (
      <div className="w-[640px] shrink-0 h-[calc(100dvh-48px)] bg-bg-deep border border-border rounded-[20px] flex items-center justify-center shadow-[0_16px_60px_rgba(0,0,0,0.5)] max-md:w-full max-md:max-w-[520px] max-md:h-[50dvh]">
        <p className="text-text-muted text-sm">Generá el scanner para ver el código</p>
      </div>
    );
  }

  const active = files[activeTab];

  return (
    <div className="w-[640px] shrink-0 h-[calc(100dvh-48px)] bg-bg-deep border border-border rounded-[20px] flex flex-col overflow-hidden shadow-[0_16px_60px_rgba(0,0,0,0.5)] max-md:w-full max-md:max-w-[520px] max-md:h-[50dvh]">
      {/* Title bar */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-[11px] font-medium text-text-muted font-mono">
          C++ Generated
        </span>
      </div>

      {/* File tabs */}
      <div className="flex overflow-x-auto border-b border-border shrink-0 bg-bg-surface scrollbar-none">
        {files.map((file, i) => (
          <button
            key={file.name}
            onClick={() => setActiveTab(i)}
            className={`px-3.5 py-2 text-[11px] font-mono whitespace-nowrap border-r border-border transition-colors shrink-0 cursor-pointer ${
              i === activeTab
                ? 'bg-bg-deep text-text-primary border-b-2 border-b-accent'
                : 'bg-transparent text-text-muted hover:bg-bg-hover hover:text-text-secondary'
            }`}
          >
            {file.name}
          </button>
        ))}
      </div>

      {/* Code body */}
      <div className="flex-1 overflow-y-auto">
        <SyntaxHighlighter
          key={active.name}
          language="cpp"
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: '16px',
            background: 'transparent',
            fontSize: '12.5px',
            lineHeight: '1.6',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          }}
          showLineNumbers
          lineNumberStyle={{ color: '#6a6a6a', fontSize: '11px', minWidth: '2.5em' }}
        >
          {active.code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
