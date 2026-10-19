// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DisplayNameSettings } from '../src/components/settings/DisplayNameSettings';
const { save } = vi.hoisted(()=>({save:vi.fn()}));
vi.mock('../src/hooks/useAuth',()=>({useAuth:()=>({user:{id:'author',user_metadata:{display_name:'Original Name'}},updateDisplayName:save})}));
beforeEach(()=>{save.mockReset();});afterEach(cleanup);
it('saves an editable display name and confirms only after the save completes',async()=>{
  save.mockResolvedValue(undefined);render(<DisplayNameSettings/>);
  fireEvent.change(screen.getByLabelText('Display name'),{target:{value:'Deion Shawn'}});
  fireEvent.click(screen.getByRole('button',{name:'Save display name'}));
  expect(save).toHaveBeenCalledWith('Deion Shawn');
  await screen.findByText('Display name saved.');
});
it('keeps the entered name and shows an error when saving fails',async()=>{
  save.mockRejectedValue(new Error('Could not save your display name. Please try again.'));render(<DisplayNameSettings/>);
  fireEvent.change(screen.getByLabelText('Display name'),{target:{value:'New Name'}});
  fireEvent.click(screen.getByRole('button',{name:'Save display name'}));
  expect((await screen.findByRole('alert')).textContent).toContain('Could not save');
  expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('New Name');
  expect(screen.queryByText('Display name saved.')).toBeNull();
});
