#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{Cursor, Read};
    use wasm_bindgen::prelude::*;
    use wasm_bindgen_test::*;
    use wasm_zip::ZipMarker;

    wasm_bindgen_test_configure!(run_in_browser);

    #[wasm_bindgen_test]
    fn test_generate_async() {
        let mut zip_marker = ZipMarker::new();
        zip_marker.file("test.txt".to_string(), b"Hello, world!".to_vec());

        let data = zip_marker.generate_async();
        let cursor = Cursor::new(data);
        let mut zip = zip::read::ZipArchive::new(cursor).unwrap();
        let mut file = zip.by_name("test.txt").unwrap();
        let mut content = String::new();
        file.read_to_string(&mut content).unwrap();

        assert_eq!(content, "Hello, world!");
    }
}
