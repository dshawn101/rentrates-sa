// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CookieNotice } from './CookieNotice';
import { COOKIE_NOTICE_EVENT, COOKIE_NOTICE_KEY } from '../../lib/cookie-preferences';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('cookie notice interactions', () => {
  it('opens settings in the banner and keeps a reopening control after reload', () => {
    const mount = () => render(<MemoryRouter><CookieNotice /></MemoryRouter>);
    const first = mount();
    fireEvent.click(screen.getByRole('button', { name: /^Cookie settings$/ }));
    expect(screen.getByText('Optional tracking · not in use')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Save & close' }));
    expect(screen.queryByRole('region')).toBeNull();
    expect(JSON.parse(localStorage.getItem(COOKIE_NOTICE_KEY)!).necessaryOnly).toBe(true);
    first.unmount();
    mount();
    expect(screen.queryByRole('region')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open cookie settings' }));
    expect(screen.getByText('Optional tracking · not in use')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Save & close' }));
    expect(screen.queryByRole('region')).toBeNull();
  });
  it('does not interrupt book editing, but permits an explicit settings request', () => {
    render(<MemoryRouter initialEntries={['/book/demo']}><CookieNotice /></MemoryRouter>);
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open cookie settings' })).toBeNull();
    act(() => window.dispatchEvent(new Event(COOKIE_NOTICE_EVENT)));
    expect(screen.getByRole('region', { name: 'Cookie and browser storage notice' })).toBeTruthy();
  });
});
