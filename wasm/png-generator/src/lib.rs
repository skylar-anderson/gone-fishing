use wasm_bindgen::prelude::*;
use image::{RgbaImage, Rgba, ImageOutputFormat};
use std::io::Cursor;

#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// Parse a hex color string (#RRGGBB or #RRGGBBAA) to RGBA values
fn parse_hex_color(hex: &str) -> Rgba<u8> {
    let hex = hex.trim_start_matches('#');

    let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(0);
    let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(0);
    let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(0);
    let a = if hex.len() >= 8 {
        u8::from_str_radix(&hex[6..8], 16).unwrap_or(255)
    } else {
        255
    };

    Rgba([r, g, b, a])
}

/// Generate a PNG from a 2D array of hex color strings
/// Input: JSON string like [["#ff0000", "#00ff00"], ["#0000ff", "#ffffff"]]
/// Returns: PNG bytes as Uint8Array
#[wasm_bindgen]
pub fn generate_texture_png(pixels_json: &str) -> Vec<u8> {
    let pixels: Vec<Vec<String>> = serde_json::from_str(pixels_json)
        .expect("Failed to parse pixels JSON");

    let height = pixels.len() as u32;
    let width = if height > 0 { pixels[0].len() as u32 } else { 0 };

    let mut img = RgbaImage::new(width, height);

    for (y, row) in pixels.iter().enumerate() {
        for (x, color) in row.iter().enumerate() {
            let rgba = parse_hex_color(color);
            img.put_pixel(x as u32, y as u32, rgba);
        }
    }

    let mut buffer = Vec::new();
    img.write_to(&mut Cursor::new(&mut buffer), ImageOutputFormat::Png)
        .expect("Failed to encode PNG");

    buffer
}

/// Generate a full scene PNG by compositing tile textures
/// tile_grid_json: 2D array of tile type strings, e.g. [["grass", "water"], ["dirt", "sand"]]
/// textures_json: Object mapping tile type to pixel arrays, e.g. {"grass": [["#4ade80", ...], ...]}
/// tile_size: Size of each tile in pixels (typically 16 or 32)
#[wasm_bindgen]
pub fn generate_scene_png(
    tile_grid_json: &str,
    textures_json: &str,
    tile_size: u32
) -> Vec<u8> {
    let tile_grid: Vec<Vec<String>> = serde_json::from_str(tile_grid_json)
        .expect("Failed to parse tile grid JSON");
    let textures: std::collections::HashMap<String, Vec<Vec<String>>> =
        serde_json::from_str(textures_json)
        .expect("Failed to parse textures JSON");

    let grid_height = tile_grid.len();
    let grid_width = if grid_height > 0 { tile_grid[0].len() } else { 0 };

    let img_width = (grid_width as u32) * tile_size;
    let img_height = (grid_height as u32) * tile_size;

    let mut img = RgbaImage::new(img_width, img_height);

    // Pre-render all texture images
    let mut texture_images: std::collections::HashMap<String, RgbaImage> =
        std::collections::HashMap::new();

    for (tile_type, pixels) in &textures {
        let tex_height = pixels.len() as u32;
        let tex_width = if tex_height > 0 { pixels[0].len() as u32 } else { 0 };

        let mut tex_img = RgbaImage::new(tex_width, tex_height);
        for (y, row) in pixels.iter().enumerate() {
            for (x, color) in row.iter().enumerate() {
                let rgba = parse_hex_color(color);
                tex_img.put_pixel(x as u32, y as u32, rgba);
            }
        }
        texture_images.insert(tile_type.clone(), tex_img);
    }

    // Composite the scene
    for (grid_y, row) in tile_grid.iter().enumerate() {
        for (grid_x, tile_type) in row.iter().enumerate() {
            if let Some(tex_img) = texture_images.get(tile_type) {
                let dest_x = (grid_x as u32) * tile_size;
                let dest_y = (grid_y as u32) * tile_size;

                // Scale texture to tile_size if needed
                let tex_width = tex_img.width();
                let tex_height = tex_img.height();

                for py in 0..tile_size {
                    for px in 0..tile_size {
                        // Sample from texture (simple nearest-neighbor scaling)
                        let src_x = (px * tex_width / tile_size).min(tex_width - 1);
                        let src_y = (py * tex_height / tile_size).min(tex_height - 1);
                        let pixel = tex_img.get_pixel(src_x, src_y);
                        img.put_pixel(dest_x + px, dest_y + py, *pixel);
                    }
                }
            }
        }
    }

    let mut buffer = Vec::new();
    img.write_to(&mut Cursor::new(&mut buffer), ImageOutputFormat::Png)
        .expect("Failed to encode PNG");

    buffer
}

/// Generate multiple texture PNGs at once (more efficient for batch operations)
/// textures_json: Object mapping tile type to pixel arrays
/// Returns: JSON string mapping tile type to base64-encoded PNG
#[wasm_bindgen]
pub fn generate_all_texture_pngs(textures_json: &str) -> String {
    use std::collections::HashMap;

    let textures: HashMap<String, Vec<Vec<String>>> =
        serde_json::from_str(textures_json)
        .expect("Failed to parse textures JSON");

    let mut results: HashMap<String, String> = HashMap::new();

    for (tile_type, pixels) in textures {
        let pixels_json = serde_json::to_string(&pixels).unwrap();
        let png_bytes = generate_texture_png(&pixels_json);

        // Base64 encode the PNG
        let base64 = base64_encode(&png_bytes);
        results.insert(tile_type, base64);
    }

    serde_json::to_string(&results).unwrap()
}

/// Simple base64 encoding
fn base64_encode(data: &[u8]) -> String {
    const ALPHABET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    let mut result = String::new();
    let chunks = data.chunks(3);

    for chunk in chunks {
        let b0 = chunk[0] as usize;
        let b1 = chunk.get(1).copied().unwrap_or(0) as usize;
        let b2 = chunk.get(2).copied().unwrap_or(0) as usize;

        result.push(ALPHABET[b0 >> 2] as char);
        result.push(ALPHABET[((b0 & 0x03) << 4) | (b1 >> 4)] as char);

        if chunk.len() > 1 {
            result.push(ALPHABET[((b1 & 0x0f) << 2) | (b2 >> 6)] as char);
        } else {
            result.push('=');
        }

        if chunk.len() > 2 {
            result.push(ALPHABET[b2 & 0x3f] as char);
        } else {
            result.push('=');
        }
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_hex_color() {
        let color = parse_hex_color("#ff0000");
        assert_eq!(color, Rgba([255, 0, 0, 255]));

        let color = parse_hex_color("#00ff00ff");
        assert_eq!(color, Rgba([0, 255, 0, 255]));
    }

    #[test]
    fn test_generate_texture_png() {
        let pixels = r##"[["#ff0000", "#00ff00"], ["#0000ff", "#ffffff"]]"##;
        let png = generate_texture_png(pixels);
        assert!(!png.is_empty());
        // PNG magic bytes
        assert_eq!(&png[0..8], &[137, 80, 78, 71, 13, 10, 26, 10]);
    }
}
