use std::io::Cursor;
use std::io::Write;
use wasm_bindgen::prelude::*;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

#[wasm_bindgen]
pub struct ZipMarker {
    zip: ZipWriter<Cursor<Vec<u8>>>,
}

#[wasm_bindgen]
impl ZipMarker {
    #[wasm_bindgen(constructor)]
    pub fn new() -> ZipMarker {
        let zip = ZipWriter::new(Cursor::new(Vec::new()));
        ZipMarker { zip }
    }
    pub fn file(&mut self, file_name: String, data: Vec<u8>) {
        let zip = &mut self.zip;
        let options =
            SimpleFileOptions::default().compression_method(zip::CompressionMethod::Stored);
        zip.start_file::<String, _, String>(file_name, options)
            .unwrap();
        zip.write_all(&data).unwrap();
    }

    #[wasm_bindgen(js_name = generateAsync)]
    pub fn generate_async(self) -> Vec<u8> {
        self.zip.finish().unwrap().into_inner()
    }
}
