/** Birleşik heybe grid — mobil 5, masaüstü 10 sütun */

export const INVENTORY_COLS_MOBILE = 5
export const INVENTORY_COLS_DESKTOP = 10
export const INVENTORY_DESKTOP_BREAKPOINT = 1024

export function getInventoryGridCols(viewportWidth: number): number {
  return viewportWidth >= INVENTORY_DESKTOP_BREAKPOINT
    ? INVENTORY_COLS_DESKTOP
    : INVENTORY_COLS_MOBILE
}

/** Başlangıçta görünen slot satırı */
export function getInitialVisibleRows(cols: number): number {
  return cols >= INVENTORY_COLS_DESKTOP ? 4 : 3
}

export function getInitialVisibleSlots(cols: number): number {
  return cols * getInitialVisibleRows(cols)
}

export function getExpandSlotStep(cols: number): number {
  return cols
}
