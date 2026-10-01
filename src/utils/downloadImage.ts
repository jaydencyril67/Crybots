import type { MouseEvent } from 'react';

export const downloadImage = async (
  event: MouseEvent<HTMLAnchorElement>,
  imageUrl: string,
  filename: string,
): Promise<void> => {
  event.preventDefault();

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Unable to download image.');
    const blobUrl = URL.createObjectURL(await response.blob());
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(blobUrl);
  } catch {
    const fallbackLink = document.createElement('a');
    fallbackLink.href = imageUrl;
    fallbackLink.download = filename;
    fallbackLink.rel = 'noopener';
    document.body.appendChild(fallbackLink);
    fallbackLink.click();
    fallbackLink.remove();
  }
};
