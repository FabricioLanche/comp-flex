import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { TokenDef } from '../types';

SyntaxHighlighter.registerLanguage('cpp', cpp);

interface Props {
  tokens: TokenDef[];
}

function generateCppCode(tokens: TokenDef[]): string {
  if (tokens.length === 0) return '// Agregá tokens para ver el código generado';

  const tokenCases = tokens.map(tok => {
    const escaped = tok.pattern
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\+/g, '\\+')
      .replace(/\*/g, '\\*')
      .replace(/\?/g, '\\?')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\|/g, '\\|');
    return `        // ${tok.name}: ${tok.pattern}\n        if (matchPattern(input, pos, "${escaped}")) {\n            return Token(TokenType::${tok.name}, lexeme);\n        }`;
  }).join('\n\n');

  const tokenEnum = tokens.map(tok => `    ${tok.name}`).join(',\n');

  return `#include <iostream>
#include <string>
#include <vector>

enum class TokenType {
${tokenEnum}
};

struct Token {
    TokenType type;
    std::string lexeme;
};

class Scanner {
private:
    std::string input;
    size_t pos;

    bool matchPattern(const std::string& input,
                      size_t& pos,
                      const std::string& pattern) {
        // TODO: connect to DFA engine
        size_t start = pos;
        // ... pattern matching logic
        return pos > start;
    }

public:
    Scanner(const std::string& input)
        : input(input), pos(0) {}

    Token nextToken() {
        while (pos < input.size()) {
            size_t start = pos;

${tokenCases}

            // No match found
            char bad = input[pos++];
            return Token(TokenType::${tokens[0].name},
                         std::string(1, bad));
        }
        return Token(TokenType::${tokens[0].name}, "");
    }
};

int main() {
    Scanner scanner("hello 123");
    Token tok;
    do {
        tok = scanner.nextToken();
        std::cout << "TOKEN("
                  << static_cast<int>(tok.type)
                  << ", " << tok.lexeme
                  << ")" << std::endl;
    } while (!tok.lexeme.empty());
    return 0;
}`;
}

export default function CodePreview({ tokens }: Props) {
  const code = generateCppCode(tokens);

  return (
    <div className="w-[640px] shrink-0 h-[calc(100dvh-48px)] bg-bg-deep border border-border rounded-[20px] flex flex-col overflow-hidden shadow-[0_16px_60px_rgba(0,0,0,0.5)] max-md:w-full max-md:max-w-[520px] max-md:h-[50dvh]">
      {/* Title bar */}
      <div className="flex items-center gap-1.5 px-4 py-3.5 border-b border-border shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-xs font-medium text-text-muted font-mono">
          scanner.cpp
        </span>
      </div>

      {/* Code body */}
      <div className="flex-1 overflow-y-auto">
        <SyntaxHighlighter
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
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
