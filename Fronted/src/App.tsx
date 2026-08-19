import { useState, useCallback, useMemo } from 'react';
import type { TokenDef, Screen } from './types';
import { buildDFA } from './engine';
import StepIndicator from './components/StepIndicator';
import TokenConstructor from './components/TokenConstructor';
import TokenList from './components/TokenList';
import StringTester from './components/StringTester';
import CodePreview from './components/CodePreview';

export default function App() {
  const [screen, setScreen] = useState<Screen>(1);
  const [tokens, setTokens] = useState<TokenDef[]>([]);
  const [dfa, setDfa] = useState<object | null>(null);

  const addToken = useCallback((name: string, pattern: string) => {
    setTokens(prev => [...prev, { name, pattern }]);
  }, []);

  const removeToken = useCallback((index: number) => {
    setTokens(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleGenerate = useCallback(() => {
    const result = buildDFA(tokens);
    setDfa(result);
    setScreen(3);
  }, [tokens]);

  const handleReset = useCallback(() => {
    setTokens([]);
    setDfa(null);
    setScreen(1);
  }, []);

  const completedSteps = useMemo(() => {
    if (screen === 3) return [1, 2];
    if (screen === 2) return [1];
    return [];
  }, [screen]);

  const handleStepClick = useCallback((step: 1 | 2 | 3) => {
    if (step === 1) {
      // Going back to step 1 from step 3 resets everything
      if (screen === 3) {
        setTokens([]);
        setDfa(null);
      }
      setScreen(1);
    } else if (step === 2) {
      setScreen(2);
    }
    // Step 3 can only be reached via "Generar Scanner"
  }, [screen]);

  return (
    <div className="flex min-h-dvh px-6 py-6 gap-4 overflow-x-hidden max-md:flex-col max-md:items-center max-md:px-2 max-md:py-2 max-md:gap-4">
      {/* Left column — always centers the device */}
      <div className="flex-1 flex justify-center items-center max-md:w-full">
        <div className="w-[440px] max-w-full h-[calc(100dvh-48px)] bg-bg-deep border border-border rounded-3xl flex flex-col overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_24px_80px_rgba(0,0,0,0.6)] max-md:w-full max-md:max-w-[440px] max-md:h-auto max-md:min-h-[70dvh]">
          {/* Stepper */}
          <StepIndicator
            currentStep={screen}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />

          {/* Screen content */}
          {screen === 1 && (
            <TokenConstructor
              tokens={tokens}
              onAddToken={addToken}
              onNext={() => setScreen(2)}
            />
          )}
          {screen === 2 && (
            <TokenList
              tokens={tokens}
              onRemoveToken={removeToken}
              onBack={() => setScreen(1)}
              onGenerate={handleGenerate}
            />
          )}
          {screen === 3 && (
            <StringTester
              dfa={dfa}
              tokens={tokens}
              onBack={() => setScreen(2)}
              onReset={handleReset}
            />
          )}
        </div>
      </div>

      {/* Right column — code preview, only on screen 3 */}
      {screen === 3 && (
        <div className="flex-1 flex justify-center items-center max-md:w-full">
          <CodePreview tokens={tokens} />
        </div>
      )}
    </div>
  );
}
