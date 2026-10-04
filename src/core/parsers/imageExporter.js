/**
 * Image Redaction Engine for JPG, PNG, and WebP documents/IDs
 * Burns permanent vector rectangles directly onto the canvas and exports high-res blob.
 */

export async function exportRedactedImage({
  imageFile,
  file,
  fileArrayBuffer,
  redactions = [],
  style = { color: '#09090b', textColor: '#ffffff', label: '[REDACTED]', showLabel: false },
  isPro = false,
  rotation = 0
}) {
  let sourceBlob = imageFile || file;
  if (!sourceBlob && fileArrayBuffer) {
    sourceBlob = new Blob([fileArrayBuffer], { type: 'image/png' });
  }
  if (!sourceBlob) {
    throw new Error('exportRedactedImage requires imageFile, file, or fileArrayBuffer');
  }
  if (sourceBlob instanceof ArrayBuffer || (typeof Uint8Array !== 'undefined' && sourceBlob instanceof Uint8Array)) {
    sourceBlob = new Blob([sourceBlob], { type: 'image/png' });
  }

  if (typeof FileReader === 'undefined' || typeof Image === 'undefined' || typeof document === 'undefined') {
    return sourceBlob instanceof Blob ? sourceBlob : new Blob([sourceBlob], { type: 'image/png' });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const rot = ((rotation % 360) + 360) % 360;
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;

        if (rot === 90 || rot === 270) {
          canvas.width = origH;
          canvas.height = origW;
        } else {
          canvas.width = origW;
          canvas.height = origH;
        }

        const ctx = canvas.getContext('2d');

        // Draw image with rotation transform
        ctx.save();
        if (rot === 90) {
          ctx.translate(canvas.width, 0);
          ctx.rotate((90 * Math.PI) / 180);
        } else if (rot === 180) {
          ctx.translate(canvas.width, canvas.height);
          ctx.rotate((180 * Math.PI) / 180);
        } else if (rot === 270) {
          ctx.translate(0, canvas.height);
          ctx.rotate((270 * Math.PI) / 180);
        }
        ctx.drawImage(img, 0, 0, origW, origH);
        ctx.restore();

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

        // Trial watermark banner for free tier
        if (!isPro) {
          const wmHeight = Math.max(24, Math.round(canvas.height * 0.035));
          ctx.fillStyle = '#f4f4f5';
          ctx.fillRect(0, canvas.height - wmHeight, canvas.width, wmHeight);
          ctx.fillStyle = '#52525b';
          const fontSize = Math.max(10, Math.round(wmHeight * 0.45));
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            'Trial Version: Redacted with Redactify (redactify.daeq.in). Upgrade to Pro for clean exports',
            canvas.width / 2,
            canvas.height - (wmHeight / 2)
          );
        }

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        }, sourceBlob.type || 'image/png', 0.95);
      };
      img.onerror = () => reject(new Error('Failed to load image for redaction'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(sourceBlob);
  });
}
