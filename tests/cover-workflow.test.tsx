// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CoverDesigner } from '../src/pages/book/steps/CoverDesigner';
const mocks = vi.hoisted(() => ({ upload:vi.fn(),update:vi.fn(),prepare:vi.fn() }));
const book = { id:'book-one',user_id:'author-one',title:'My Book',metadata:{author:'Author',synopsis:'Keep this'},status:'writing' as const,tier_created:'free',created_at:'',updated_at:'' };
vi.mock('../src/hooks/useAuth',()=>({useAuth:()=>({user:{id:'author-one'}})}));
vi.mock('../src/store/useBookStore',()=>({useBookStore:{getState:()=>({books:[],updateBook:mocks.update})}}));
vi.mock('../src/lib/supabase',()=>({supabase:{storage:{from:()=>({upload:mocks.upload})}}}));
vi.mock('../src/lib/covers',()=>({COVER_BUCKET:'book-covers',prepareCover:mocks.prepare,getCoverUrl:vi.fn().mockResolvedValue('https://storage.example/cover.jpg')}));
beforeEach(()=>{vi.clearAllMocks();mocks.upload.mockResolvedValue({error:null});mocks.update.mockResolvedValue(undefined);mocks.prepare.mockResolvedValue({blob:new Blob(['jpg'],{type:'image/jpeg'}),width:1200,height:1800,dataUrl:'data:image/jpeg;base64,test'});});
afterEach(cleanup);
it('previews an imported file and saves it to a private owner/book path without losing metadata',async()=>{
  render(<CoverDesigner book={book} onNext={vi.fn()} onPrev={vi.fn()}/>);
  fireEvent.change(screen.getByLabelText('Upload cover image'),{target:{files:[new File(['image'],'cover.png',{type:'image/png'})]}});
  fireEvent.click(await screen.findByText('Save this cover'));
  await waitFor(()=>expect(mocks.update).toHaveBeenCalled());
  expect(mocks.upload.mock.calls[0][0]).toMatch(/^author-one\/book-one\/.+\.jpg$/);
  expect(mocks.update.mock.calls[0][1].metadata).toMatchObject({author:'Author',synopsis:'Keep this',coverWidth:1200,coverHeight:1800});
});
it('keeps the selected image available for retry when the upload fails',async()=>{
  mocks.upload.mockResolvedValue({error:{message:'offline'}});
  render(<CoverDesigner book={book} onNext={vi.fn()} onPrev={vi.fn()}/>);
  fireEvent.change(screen.getByLabelText('Upload cover image'),{target:{files:[new File(['image'],'cover.png',{type:'image/png'})]}});
  fireEvent.click(await screen.findByText('Save this cover'));
  await screen.findByRole('alert');expect(mocks.update).not.toHaveBeenCalled();expect(screen.getByText('Save this cover')).toBeTruthy();
});
it('can continue without a cover and without an AI key',()=>{
  const next=vi.fn();render(<CoverDesigner book={book} onNext={next} onPrev={vi.fn()}/>);
  fireEvent.click(screen.getByText('Continue without cover'));expect(next).toHaveBeenCalledOnce();
});
