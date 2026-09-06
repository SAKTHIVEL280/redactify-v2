/**
 * Image Redaction Engine for JPG, PNG, and WebP documents/IDs
 * Burns permanent vector rectangles directly onto the canvas and exports high-res blob.
 */

export async function exportRedactedImage({
  imageFile,
  redactions,
  style = { color: '#09090b', textColor: '#ffffff', label: '[REDACTED]', showLabel: false }
}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');

        // Draw original image
        ctx.drawImage(img, 0, 0);

        const activeRedactions = redactions.filter(r => r.redact);

        for (const r of activeRedactions) {
          const x = r.x * canvas.width;
          const y = r.y * canvas.height;
          const w = r.width * canvas.width;
          const h = r.height * canvas.height;

          // Draw solid blackout/colored rectangle
          ctx.fillStyle = style.color || '#09090b';
          ctx.fillRect(x, y, w, h);

          // Draw optional label
          if (style.showLabel && style.label) {
            const labelText = r.suggested || style.label;
            const fontSize = Math.max(10, Math.min(h * 0.5, 18));
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillStyle = style.textColor || '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const measured = ctx.measureText(labelText).width;
            if (measured < w - 6) {
              ctx.fillText(labelText, x + (w / 2), y + (h / 2));
            }
          }
        }

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        }, imageFile.type || 'image/png', 0.95);
      };
      img.onerror = () => reject(new Error('Failed to load image for redaction'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(imageFile);
  });
}
