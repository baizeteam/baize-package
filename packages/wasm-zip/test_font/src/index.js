import saveAs from "file-saver";
import JSZip from "jszip";

const $input = document.querySelector('[data-js="input"]');
const $list = document.querySelector('[data-js="list"]');
const $template = document.querySelector('[data-js="list-item-template"]');

$input.addEventListener("change", loadZip);
async function loadZip(ev) {
  const wasm = await import("wasm-zip");
  await wasm.default();
  const files = ev.target.files;
  if (!files.length) {
    return false;
  }
  const buffer = [...files].map((file) => readFile(file));

  Promise.all(buffer)
    .then((fileRes) => {
      console.time("wasm zip");
      const zipMarker = new wasm.ZipMarker();
      fileRes.map((item) => {
        zipMarker.file(item.name, item.buf);
      });
      let res_buffer = zipMarker.generateAsync();
      const blob = new Blob([res_buffer], { type: "application/octet-stream" });
      console.timeEnd("wasm zip");
      saveAs(blob, "a.zip");
      return fileRes;
    })
    .then((fileRes) => {
      const zip = new JSZip();
      console.time("jszip");
      fileRes.map((item) => {
        zip.file(item.name, item.buf);
      });
      zip.generateAsync({ type: "blob" }).then((blob) => {
        console.timeEnd("jszip");
        saveAs(blob, "b.zip");
      });
    });
}

async function readFile(file) {
  const ab = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("loadend", () => resolve(reader.result));
    reader.addEventListener("error", reject);
    reader.readAsArrayBuffer(file);
  });
  return { buf: new Uint8Array(ab), name: file.name };
}
