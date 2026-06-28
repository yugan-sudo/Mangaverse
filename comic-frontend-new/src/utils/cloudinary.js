// ─── Cloudinary Upload Utility ────────────────────────────────────────────
// Reads cloud name and upload preset from Vite env vars (never hardcode these).
// Add to your .env file (see .env.example for the variable names).
// Never commit .env to git — it is already in .gitignore.

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

if (!CLOUD_NAME || !UPLOAD_PRESET) {
  console.warn(
    '[Cloudinary] VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET is not set. ' +
    'File uploads will fail. Add these to your .env file.'
  );
}

// ─── Upload ONE file to Cloudinary ───────────────────────────────────────
export async function uploadToCloudinary(file, onProgress) {
  if (!CLOUD_NAME || !UPLOAD_PRESET)
    throw new Error('Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env');
  if (!file.type.startsWith('image/'))
    throw new Error('Only image files are allowed.');
  if (file.size > 10 * 1024 * 1024)
    throw new Error('File too large. Max 10MB per image.');

  const form = new FormData();
  form.append('file',          file);
  form.append('upload_preset', UPLOAD_PRESET);
  form.append('folder',        'mangaverse');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable && onProgress)
        onProgress(Math.round((e.loaded / e.total) * 100));
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve(data.secure_url);
      } else {
        reject(new Error('Upload failed: ' + xhr.statusText));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error.')));

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
    xhr.send(form);
  });
}

// ─── Upload MANY files (all chapter pages) in parallel ───────────────────
export async function uploadMultiple(files, onProgress) {
  const total      = files.length;
  const progresses = new Array(total).fill(0);

  const promises = files.map((file, i) =>
    uploadToCloudinary(file, pct => {
      progresses[i] = pct;
      const overall = Math.round(
        progresses.reduce((a, b) => a + b, 0) / total
      );
      if (onProgress) onProgress(overall, i + 1, total);
    })
  );

  return Promise.all(promises);
}
