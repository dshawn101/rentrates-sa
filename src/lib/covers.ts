import { supabase } from './supabase';
export const COVER_BUCKET = 'book-covers';
export function validateCoverFile(file: Pick<File, 'size' | 'type'>) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPG or WebP image. Export PDF or SVG artwork as an image first.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Choose an image smaller than 10 MB.');
  if (!file.size) throw new Error('This image file is empty.');
}
export function fitCover(width: number, height: number, pageWidth = 148, pageHeight = 210) {
  if (!(width > 0 && height > 0)) throw new Error('Invalid cover dimensions.');
  const scale = Math.min(pageWidth / width, pageHeight / height);
  return { x: (pageWidth - width * scale) / 2, y: (pageHeight - height * scale) / 2, width: width * scale, height: height * scale };
}
export async function prepareCover(file: File): Promise<{ blob: Blob; width: number; height: number; dataUrl: string }> {
  validateCoverFile(file);
  const source = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = source; await img.decode();
    if (img.naturalWidth > 30000 || img.naturalHeight > 30000 || img.naturalWidth * img.naturalHeight > 60000000) throw new Error('This image is too large to process. Resize it to under 60 megapixels.');
    const ratio = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio)); canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
    const context = canvas.getContext('2d'); if (!context) throw new Error('Your browser could not prepare the cover.');
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not process this image.')), 'image/jpeg', 0.9));
    if (blob.size > 3 * 1024 * 1024) throw new Error('The prepared image is too large. Try a smaller source image.');
    return { blob, width: canvas.width, height: canvas.height, dataUrl: canvas.toDataURL('image/jpeg', 0.9) };
  } catch (error) { throw error instanceof Error && /too large|prepare|process/.test(error.message) ? error : new Error('This file could not be decoded as an image. Choose a valid PNG, JPG or WebP.'); }
  finally { URL.revokeObjectURL(source); }
}
export async function getCoverUrl(path: string) {
  const { data, error } = await supabase.storage.from(COVER_BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
export async function readCoverForPDF(path: string, width: number, height: number) {
  const { data, error } = await supabase.storage.from(COVER_BUCKET).download(path);
  if (error || !data) throw new Error('The saved cover could not be loaded. Go back to Cover and retry, or remove the cover before exporting.');
  const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Could not read the saved cover.')); reader.readAsDataURL(data); });
  return { dataUrl, width, height };
}
