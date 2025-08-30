



/**
 * Backwards-compat admin/status stubs (kept to avoid breakage elsewhere)
 */
export async function compileDSPyPrograms() {
  // No-op: Ax doesn't need offline compilation here
  return { success: true, timestamp: new Date() };
}
export function getDSPyStatus() {
  return { isCompiled: true, lastCompilationTime: new Date(), cacheExpired: false, programCount: 1 };
}
