'use client';
// kartoverlay/src/components/ScreenshotUpload.tsx

import { useCallback, useState } from 'react';

interface ScreenshotUploadProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

export default function ScreenshotUpload({ onFiles, disabled }: ScreenshotUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (arr.length === 0) return;

      const readers = arr.map(
        (f) =>
          new Promise<string>((res) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.readAsDataURL(f);
          })
      );
      Promise.all(readers).then(setPreviews);
      onFiles(arr);
    },
    [onFiles]
  );

  return (
    <div>
      <label
        style={{
          ...styles.dropZone,
          ...(dragging ? styles.dropZoneDragging : {}),
          ...(disabled ? styles.dropZoneDisabled : {}),
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
        />
        {previews.length === 0 ? (
          <div style={styles.dropContent}>
            <div style={styles.uploadIcon}>⬆</div>
            <div style={styles.dropTitle}>Drop timing screenshots here</div>
            <div style={styles.dropSub}>
              RaceChrono · AiM · MyChron · any lap table
              <br />
              1 or 2 images · PNG, JPG, or HEIC
            </div>
          </div>
        ) : (
          <div style={styles.previewGrid}>
            {previews.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt={`Screenshot ${i + 1}`}
                style={styles.previewImg}
              />
            ))}
            <div style={styles.replaceHint}>Click or drop to replace</div>
          </div>
        )}
      </label>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  dropZone: {
    display: 'block',
    border: '2px dashed rgba(255,100,0,0.4)',
    borderRadius: 8,
    padding: 32,
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
    background: 'rgba(255,100,0,0.03)',
    textAlign: 'center',
  },
  dropZoneDragging: {
    borderColor: 'rgba(255,100,0,0.9)',
    background: 'rgba(255,100,0,0.08)',
  },
  dropZoneDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  dropContent: {},
  uploadIcon: {
    fontSize: 32,
    marginBottom: 10,
    color: 'rgba(255,100,0,0.6)',
  },
  dropTitle: {
    color: '#fff',
    fontWeight: 600,
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  dropSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    lineHeight: 1.6,
  },
  previewGrid: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'relative',
  },
  previewImg: {
    maxWidth: 200,
    maxHeight: 300,
    borderRadius: 4,
    border: '1px solid rgba(255,100,0,0.3)',
    objectFit: 'contain',
  },
  replaceHint: {
    width: '100%',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginTop: 8,
  },
};
