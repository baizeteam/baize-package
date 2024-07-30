import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { compressImageWorker } from '../lib/main'; // 假设这个函数是在主线程中定义的

function App() {
  useEffect(() => {}, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    console.time('compressImageWorker');
    try {
      const compressedFile = await compressImageWorker(file);
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
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('app')!).render(<App />);
