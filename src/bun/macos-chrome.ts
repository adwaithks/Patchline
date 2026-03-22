import { dlopen, FFIType, type Pointer } from "bun:ffi";
import { join } from "path";

const dylibPath = join(import.meta.dir, "libPatchlineNative.dylib");

let lib: ReturnType<typeof dlopen> | null = null;

export function tryLoadPatchlineMacChrome(): boolean {
	if (process.platform !== "darwin") {
		return false;
	}
	try {
		const size = Bun.file(dylibPath).size;
		if (size < 512) {
			return false;
		}
		lib = dlopen(dylibPath, {
			patchline_enable_window_vibrancy: {
				args: [FFIType.ptr],
				returns: FFIType.bool,
			},
			patchline_set_window_corner_radius: {
				args: [FFIType.ptr, FFIType.f64],
				returns: FFIType.bool,
			},
		});
		return true;
	} catch {
		lib = null;
		return false;
	}
}

export function enableMacWindowVibrancy(windowPtr: Pointer): boolean {
	if (!lib) {
		return false;
	}
	const sym = lib.symbols.patchline_enable_window_vibrancy as unknown as (
		wp: Pointer,
	) => boolean;
	return sym(windowPtr);
}

export function setMacWindowCornerRadius(
	windowPtr: Pointer,
	radiusPoints: number,
): boolean {
	if (!lib) {
		return false;
	}
	const sym = lib.symbols.patchline_set_window_corner_radius as unknown as (
		wp: Pointer,
		r: number,
	) => boolean;
	return sym(windowPtr, radiusPoints);
}
