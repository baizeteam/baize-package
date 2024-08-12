import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { ACCEPT_IMG_TYPES } from "../lib/config";
import { compressImageWorker, compressImagesWorker } from "../lib/main";
import { transformBytes2HumanRead } from "../lib/utils";
// import { compressImageWorker } from "../dist/index.js";

function App() {
  const [originalImageUrl, setOriginalImageUrl] = useState("");
  const [compressedImageUrl, setCompressedImageUrl] = useState("");
  const [originalImages, setOriginalImages] = useState<File[]>([]);
  const [compressedImages, setCompressedImages] = useState<Array<File | undefined>>([]);

  const reset = () => {
    setOriginalImages([]);
    setCompressedImages([]);
  };

  const commonLog = (file: File, compressedFile?: File) => {
    if (!compressedFile) return console.error("Compression failed", file);

    console.log(`%c [ res ]-${file.name}`, "font-size:13px; background:pink; color:#bf2c9f;", compressedFile);

    const originalSize = file.size;
    const compressedSize = compressedFile.size;
    const rate = ((originalSize - compressedSize) / originalSize) * 100;
    console.log(
      `Compress Rate: ${rate.toFixed(2)}%. Original: ${transformBytes2HumanRead(
        originalSize,
      )}, Compressed: ${transformBytes2HumanRead(compressedSize)}`,
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    try {
      console.time("Compress Elapse");
      const compressedFile = await compressImageWorker(file);

      const originalUrl = URL.createObjectURL(file);
      setOriginalImageUrl(originalUrl);

      const compressedUrl = URL.createObjectURL(compressedFile);
      setCompressedImageUrl(compressedUrl);

      commonLog(file, compressedFile);

      console.timeEnd("Compress Elapse");
    } catch (error) {
      console.error("Compression failed:", error);
    }
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

      const compressedImages = await compressImagesWorker(originalImages);
      setCompressedImages(compressedImages);

      originalImages.forEach((file, index) => {
        commonLog(file, compressedImages[index]);
      });

      console.timeEnd("Compress Elapse");
    } catch (error) {
      console.error("Compression failed:", error);
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
        {/* Left */}
        <div
          style={{
            flex: 1,
          }}
        >
          <input accept={ACCEPT_IMG_TYPES.join(",")} type="file" onChange={handleFileChange} />
          <div style={{ display: originalImageUrl ? "block" : "none" }}>
            <h2>原图</h2>
            <img src={originalImageUrl} style={{ maxHeight: "200px" }} alt="Original Image" />
          </div>
          <div style={{ display: originalImageUrl ? "block" : "none" }}>
            <h2>压缩图</h2>
            <img src={compressedImageUrl} style={{ maxHeight: "200px" }} alt="Compressed Image" />
          </div>
        </div>
        {/* Right */}
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
                  style={{ display: "block", maxHeight: "200px" }}
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
                return (
                  <img
                    key={index}
                    src={URL.createObjectURL(file || originalImages[index])}
                    style={{ display: "block", maxHeight: "200px", filter: file ? undefined : "brightness(0.3)" }}
                    alt="Compressed Image"
                  />
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
