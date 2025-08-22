import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { ACCEPT_IMG_TYPES } from "../lib/config";
import { compressImagesWorker } from "../lib/main";

function App() {
  const [originalImages, setOriginalImages] = useState<File[]>([]);
  const [compressedImages, setCompressedImages] = useState<Array<File | undefined>>([]);
  const [compressionInfo, setCompressionInfo] = useState<
    Array<{ rate: number; time: number; originalSize: number; compressedSize: number } | undefined>
  >([]);

  const reset = () => {
    setOriginalImages([]);
    setCompressedImages([]);
    setCompressionInfo([]);
  };

  const handleMultipleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }
    reset();

    try {
      console.time("Compress Elapse");
      const originalImages = Array.from(files);
      setOriginalImages(originalImages);

      const compressionResults = await compressImagesWorker(originalImages, {
        quality: 0.5,
        workerNum: 8,
      });

      const compressedImages = compressionResults.map((res) => {
        if (res.status === "rejected") {
          console.error("Compression failed", res.reason);
          return undefined;
        }
        return res.value.file;
      });
      setCompressedImages(compressedImages);

      const compressionInfo = compressionResults.map((res) => {
        if (res.status === "rejected") {
          return undefined;
        }
        return res.value.compressInfo;
      });
      setCompressionInfo(compressionInfo);

      console.timeEnd("Compress Elapse");
    } catch (error) {
      console.error("handleMultipleFileChange error:", error);
    }
  };

  return (
    <div>
      Hello baize-compress-image!
      <br />
      <br />
      <div
        style={{
          display: "flex",
        }}
      >
        <div
          style={{
            flex: 1,
          }}
        >
          <label htmlFor="image_uploads">Choose images to upload (PNG, JPG)</label>
          <input
            accept={ACCEPT_IMG_TYPES.join(",")}
            type="file"
            multiple
            onChange={handleMultipleFileChange}
            id="image_uploads"
            name="image_uploads"
          />
          <div
            style={{
              display: "flex",
            }}
          >
            <div
              style={{
                flex: 1,
              }}
            >
              <h2>原图</h2>
              {originalImages.map((file, index) => (
                <img
                  key={index}
                  src={URL.createObjectURL(file)}
                  style={{ display: "block", maxHeight: "400px" }}
                  alt="Original Image"
                />
              ))}
            </div>
            <div
              style={{
                flex: 1,
              }}
            >
              <h2>压缩图</h2>
              {compressedImages.map((file, index) => {
                const info = compressionInfo[index];
                return (
                  <div key={index}>
                    <img
                      src={URL.createObjectURL(file || originalImages[index])}
                      style={{ display: "block", maxHeight: "400px", filter: file ? undefined : "brightness(0.3)" }}
                      alt="Compressed Image"
                    />
                    {info && (
                      <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                        压缩率: {info.rate.toFixed(2)}% | 耗时: {info.time.toFixed(2)}ms
                        <br />
                        原始大小: {(info.originalSize / 1024).toFixed(2)}KB | 压缩后:{" "}
                        {(info.compressedSize / 1024).toFixed(2)}KB
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")!).render(<App />);
