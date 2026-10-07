import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: string) => {
    if (url === '/api/config') {
      return { ok: true, json: async () => ({ envKeys: { anthropic: false, google: false } }) };
    }
    return { ok: true, json: async () => ({ code: 'const A = () => null;\nrender(<A />);' }) };
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe('App 설정 유지', () => {
  it('선택한 제공자가 다시 마운트해도 유지된다', async () => {
    const user = userEvent.setup();
    const first = render(<App />);
    await user.selectOptions(screen.getByLabelText('제공자'), 'anthropic');
    first.unmount();

    render(<App />);
    expect(screen.getByLabelText('제공자')).toHaveValue('anthropic');
  });

  it('입력한 API 키가 다시 마운트해도 유지된다', async () => {
    const user = userEvent.setup();
    const first = render(<App />);
    await user.type(screen.getByLabelText('API 키'), 'AIza-test');
    first.unmount();

    render(<App />);
    expect(screen.getByLabelText('API 키')).toHaveValue('AIza-test');
  });

  it('API 키는 제공자별로 따로 저장되어 다른 제공자에 섞이지 않는다', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('API 키'), 'google-key');
    await user.selectOptions(screen.getByLabelText('제공자'), 'anthropic');
    expect(screen.getByLabelText('API 키')).toHaveValue('');

    await user.type(screen.getByLabelText('API 키'), 'anthropic-key');
    await user.selectOptions(screen.getByLabelText('제공자'), 'google');
    expect(screen.getByLabelText('API 키')).toHaveValue('google-key');
  });

  it('저장된 제공자 값이 올바르지 않으면 기본값(Google)을 사용한다', () => {
    localStorage.setItem('rcg:provider', JSON.stringify('unknown'));
    render(<App />);
    expect(screen.getByLabelText('제공자')).toHaveValue('google');
  });

  it('생성한 프롬프트가 최근 프롬프트로 표시되고 요청에는 현재 제공자의 키만 담긴다', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('API 키'), 'google-key');
    await user.type(screen.getByPlaceholderText(/검색 필터 바를 만들어줘/), '프로필 카드');
    await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));

    expect(await screen.findByRole('button', { name: '프로필 카드' })).toBeInTheDocument();
    const generateCall = fetchMock.mock.calls.find(([url]) => url === '/api/generate');
    expect(JSON.parse(generateCall![1].body)).toMatchObject({
      apiKey: 'google-key',
      provider: 'google',
    });
  });
});
