import heic2any from 'heic2any';

/**
 * Checks whether a given File or Blob represents a HEIC / HEIF image.
 */
export function isHeicFile(file: File | Blob): boolean {
  if (!file) return false;

  const fileName = 'name' in file && typeof file.name === 'string' ? file.name.toLowerCase() : '';
  const fileType = file.type ? file.type.toLowerCase() : '';

  return (
    fileName.endsWith('.heic') ||
    fileName.endsWith('.heif') ||
    fileType === 'image/heic' ||
    fileType === 'image/heif' ||
    fileType.includes('heic') ||
    fileType.includes('heif')
  );
}

/**
 * Converts a HEIC / HEIF File or Blob to a standard JPEG File with .jpg extension.
 * If conversion is not applicable or fails, falls back to the original file safely.
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file;
  }

  try {
    const conversionResult = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92,
    });

    const convertedBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
    const baseName = file.name ? file.name.replace(/\.(heic|heif)$/i, '') : 'photo';
    const newFileName = `${baseName}.jpg`;

    return new File([convertedBlob], newFileName, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn('[heicConverter] HEIC conversion skipped or encountered an error:', err);
    return file;
  }
}

/**
 * Helper to process an array or FileList of files, converting any HEIC items to JPEG.
 */
export async function processMediaFiles(files: FileList | File[]): Promise<File[]> {
  const fileArray = Array.from(files);
  const processed: File[] = [];

  for (const f of fileArray) {
    if (isHeicFile(f)) {
      try {
        const converted = await convertHeicToJpeg(f);
        processed.push(converted);
      } catch {
        processed.push(f);
      }
    } else {
      processed.push(f);
    }
  }

  return processed;
}
