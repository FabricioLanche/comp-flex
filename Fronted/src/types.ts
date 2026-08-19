export interface TokenDef {
  name: string;
  pattern: string;
}

export interface ScanResult {
  type: 'token' | 'error';
  name?: string;
  lexema?: string;
  char?: string;
  position?: number;
}

export type Screen = 1 | 2 | 3;
