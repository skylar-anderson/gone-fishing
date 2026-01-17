/* tslint:disable */
/* eslint-disable */

/**
 * Generate multiple texture PNGs at once (more efficient for batch operations)
 * textures_json: Object mapping tile type to pixel arrays
 * Returns: JSON string mapping tile type to base64-encoded PNG
 */
export function generate_all_texture_pngs(textures_json: string): string;

/**
 * Generate a full scene PNG by compositing tile textures
 * tile_grid_json: 2D array of tile type strings, e.g. [["grass", "water"], ["dirt", "sand"]]
 * textures_json: Object mapping tile type to pixel arrays, e.g. {"grass": [["#4ade80", ...], ...]}
 * tile_size: Size of each tile in pixels (typically 16 or 32)
 */
export function generate_scene_png(tile_grid_json: string, textures_json: string, tile_size: number): Uint8Array;

/**
 * Generate a PNG from a 2D array of hex color strings
 * Input: JSON string like [["#ff0000", "#00ff00"], ["#0000ff", "#ffffff"]]
 * Returns: PNG bytes as Uint8Array
 */
export function generate_texture_png(pixels_json: string): Uint8Array;

export function init(): void;
