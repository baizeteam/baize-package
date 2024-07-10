// import React from "react";
import ReactDOM from "react-dom/client";
import { compressImageWorker } from "../lib/main";
// import { compressImageWorker } from "../dist/index.js";
import { useEffect } from "react";

function App() {
  useEffect(() => {}, []);

  const handleFileChange = async (e: any) => {
    const file = e.target.files[0];
    console.time("compressImageWorker");
    const res = await compressImageWorker(file);
    console.log("%c [ res ]-12", "font-size:13px; background:pink; color:#bf2c9f;", res);
    console.timeEnd("compressImageWorker");
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

ReactDOM.createRoot(document.getElementById("app")!).render(<App />);
