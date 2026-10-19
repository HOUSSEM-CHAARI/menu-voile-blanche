/** Crop frame chosen in the back office, in pixels of the (auto-oriented) photo. */
export interface CropArea {
  left: number
  top: number
  width: number
  height: number
}

/**
 * Keeps a crop frame inside the photo. The browser rounds each value separately, so
 * left + width can overshoot the edge by a pixel, which sharp rejects ("bad extract area").
 * Returns undefined when the frame is unusable: the whole photo is then centre-cropped.
 */
export function clampCrop(crop: CropArea, width: number, height: number): CropArea | undefined {
  const left = Math.min(Math.max(0, Math.round(crop.left)), width - 1)
  const top = Math.min(Math.max(0, Math.round(crop.top)), height - 1)
  const area = {
    left,
    top,
    width: Math.min(Math.round(crop.width), width - left),
    height: Math.min(Math.round(crop.height), height - top),
  }
  return area.width >= 50 && area.height >= 50 ? area : undefined
}
