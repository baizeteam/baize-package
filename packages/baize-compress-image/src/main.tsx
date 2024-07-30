import React, { useEffect, useState } from'react';
import ReactDOM from'react-dom/client';
import { compressImageWorker } from '../lib/main';

function App() {
  useEffect(() => {}, []);

  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [compressedImageUrl, setCompressedImageUrl] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    console.time('compressImageWorker');
    try {
      const compressedFile = await compressImageWorker(file);

      const originalUrl = URL.createObjectURL(file);
      setOriginalImageUrl(originalUrl);

      const compressedUrl = URL.createObjectURL(compressedFile);
      setCompressedImageUrl(compressedUrl);


      console.log('%c [ res ]-12', 'font-size:13px; background:pink; color:#bf2c9f;', compressedFile);
      console.timeEnd('compressImageWorker');
    } catch (error) {
      console.error('Compression failed:', error);
    }
  };

  return (
    <div>
      Hello localforage-worker!
      <div>
        <input type="file" onChange={handleFileChange} />
      </div>
      <div style={{display: originalImageUrl ? 'block' : 'none'}}>
        <h2>原图</h2>
        <img src={originalImageUrl} style={{maxHeight: '200px'}} alt="Original Image" />
      </div>
      <div style={{display: originalImageUrl ? 'block' : 'none'}}>
        <h2>压缩图</h2>
        <img src={compressedImageUrl} style={{maxHeight: '200px'}} alt="Compressed Image" />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('app')!).render(<App />);