// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../src/hooks/useAuth';
const mocks = vi.hoisted(() => ({ getSession: vi.fn(), onAuthStateChange: vi.fn(), single: vi.fn(), from: vi.fn(), error: vi.fn() }));
vi.mock('../src/lib/supabase', () => ({ supabaseConfigError: null, handleSupabaseError: mocks.error, supabase: { auth: { getSession: mocks.getSession, onAuthStateChange: mocks.onAuthStateChange }, from: mocks.from } }));
function Status() {
  const { user } = useAuth();
  return <p>{user ? 'Signed-in dashboard' : 'Login available'}</p>;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  mocks.single.mockResolvedValue({ data: null, error: { message: 'Missing profile table' } });
  mocks.from.mockReturnValue({ select: () => ({ eq: () => ({ abortSignal: () => ({ single: mocks.single }) }) }) });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
it('renders a restored session even when the profile table is missing', async () => {
  mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } }, error: null });
  render(<AuthProvider><Status /></AuthProvider>);
  await screen.findByText('Signed-in dashboard');
  await screen.findByText(/Account details are unavailable/);
  expect(screen.queryByRole('status')).toBeNull();
});
it('keeps the auth event callback synchronous and loads the profile outside the callback', async () => {
  mocks.getSession.mockReturnValue(new Promise(() => {}));
  render(<AuthProvider><Status /></AuthProvider>);
  const callback = mocks.onAuthStateChange.mock.calls[0][0];
  act(() => {
    expect(callback('SIGNED_IN', { user: { id: 'user-1' } })).toBeUndefined();
    expect(mocks.from).not.toHaveBeenCalled();
  });
  await screen.findByText('Signed-in dashboard');
  await waitFor(() => expect(mocks.from).toHaveBeenCalledWith('user_profiles'));
});
it('shows the login page after session restoration fails instead of a blank screen', async () => {
  mocks.getSession.mockRejectedValue(new Error('offline'));
  render(<AuthProvider><Status /></AuthProvider>);
  await screen.findByText('Login available');
  expect(screen.getByRole('alert').textContent).toContain('Could not restore');
});
it('bounds a hung initial session lookup', async () => {
  vi.useFakeTimers();
  mocks.getSession.mockReturnValue(new Promise(() => {}));
  render(<AuthProvider><Status /></AuthProvider>);
  await act(async () => { vi.advanceTimersByTime(15000); });
  expect(screen.getByText('Login available')).toBeTruthy();
  expect(screen.getByRole('alert').textContent).toContain('took too long');
});
