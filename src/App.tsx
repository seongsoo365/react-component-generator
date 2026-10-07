import { useState, useEffect } from 'react';
import { PromptInput } from './components/PromptInput';
import { ComponentCard } from './components/ComponentCard';
import { Window } from './components/Window';
import { useComponentGenerator } from './hooks/useComponentGenerator';
import { usePersistentState } from './hooks/usePersistentState';
import type { Provider } from './types';
import './App.css';

const PROVIDER_CONFIG = {
  anthropic: { label: 'Anthropic', placeholder: 'sk-ant-...' },
  google: { label: 'Google', placeholder: 'AIza...' },
} as const;

const PROVIDER_KEY = 'rcg:provider';
const API_KEYS_KEY = 'rcg:apiKeys';

function parseProvider(raw: unknown): Provider {
  return raw === 'anthropic' || raw === 'google' ? raw : 'google';
}

function parseApiKeys(raw: unknown): Record<Provider, string> {
  const stored = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    anthropic: typeof stored.anthropic === 'string' ? stored.anthropic : '',
    google: typeof stored.google === 'string' ? stored.google : '',
  };
}

function App() {
  const [apiKeys, setApiKeys] = usePersistentState<Record<Provider, string>>(
    API_KEYS_KEY,
    { anthropic: '', google: '' },
    parseApiKeys,
  );
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = usePersistentState<Provider>(PROVIDER_KEY, 'google', parseProvider);
  const [envKeys, setEnvKeys] = useState<Record<Provider, boolean>>({
    anthropic: false,
    google: false,
  });
  const { components, history, isLoading, error, generate, removeComponent, clearAll } =
    useComponentGenerator();
  // 키는 제공자별로 따로 보관한다. 다른 제공자의 키가 요청에 실려 가지 않게 하는 장치다.
  const apiKey = apiKeys[provider];
  const setApiKey = (value: string) => setApiKeys((prev) => ({ ...prev, [provider]: value }));

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setEnvKeys(data.envKeys))
      .catch(() => {});
  }, []);

  const hasEnvKey = envKeys[provider];

  const handleGenerate = (prompt: string) => {
    if (!apiKey.trim() && !hasEnvKey) {
      alert(`${PROVIDER_CONFIG[provider].label} API 키를 입력하거나 .env에 설정해주세요.`);
      return;
    }
    generate(prompt, apiKey || undefined, provider);
  };

  const activeProvider = PROVIDER_CONFIG[provider].label;

  return (
    <div className="app">
      <header className="menubar">
        <div className="menubar-brand">
          <span className="brand-mark" aria-hidden="true">RC</span>
          <strong>React 컴포넌트 생성기</strong>
        </div>
        <dl className="menubar-status" aria-label="현재 작업 상태">
          <div>
            <dt>제공자</dt>
            <dd>{activeProvider}</dd>
          </div>
          <div>
            <dt>컴포넌트</dt>
            <dd>{components.length}개</dd>
          </div>
        </dl>
      </header>

      <main className="workspace">
        <Window title="새 컴포넌트" className="win-composer">
          <PromptInput onGenerate={handleGenerate} isLoading={isLoading} history={history} />
        </Window>

        <Window title="실행 설정" className="win-settings">
          <div className="field">
            <label htmlFor="provider">제공자</label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
            >
              {Object.entries(PROVIDER_CONFIG).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="api-key">API 키</label>
            <div className="api-key-field">
              <input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  hasEnvKey
                    ? '서버 키 사용 중 (직접 입력으로 덮어쓰기 가능)'
                    : PROVIDER_CONFIG[provider].placeholder
                }
              />
              <button
                className="btn btn-toggle-key"
                onClick={() => setShowKey(!showKey)}
                type="button"
              >
                {showKey ? '숨기기' : '보기'}
              </button>
            </div>
            <p className={`key-status ${hasEnvKey ? 'key-status--ready' : ''}`}>
              {hasEnvKey ? '.env 키가 연결되어 있습니다.' : '직접 입력하거나 서버 환경변수를 설정하세요.'}
            </p>
          </div>
        </Window>
      </main>

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-icon" aria-hidden="true">!</span>
          <p>{error}</p>
        </div>
      )}

      <section className="results-section" aria-label="생성 결과">
        {components.length > 0 && (
          <div className="results-header">
            <h2>생성된 컴포넌트 {components.length}개</h2>
            <button className="btn btn-clear" onClick={clearAll}>
              전체 삭제
            </button>
          </div>
        )}

        {components.length === 0 && !isLoading && (
          <Window title="비어 있음" className="win-empty">
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">
                <div className="empty-icon-tab" />
                <div className="empty-icon-body" />
              </div>
              <div className="empty-copy">
                <h3>아직 만든 컴포넌트가 없어요.</h3>
                <p>
                  위 입력창에 만들고 싶은 UI를 적고 <b>컴포넌트 생성</b>을 누르면 이곳에 창이 열립니다.
                </p>
              </div>
            </div>
          </Window>
        )}

        {isLoading && (
          <Window title="생성 중" className="win-loading">
            <div className="loading-card" role="status">
              <p>컴포넌트를 생성하고 있습니다...</p>
              <div className="progress" aria-hidden="true">
                <div className="progress-bar" />
              </div>
            </div>
          </Window>
        )}

        <div className="results-grid">
          {components.map((component) => (
            <ComponentCard
              key={component.id}
              component={component}
              onRemove={removeComponent}
              onRegenerate={handleGenerate}
              isLoading={isLoading}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
