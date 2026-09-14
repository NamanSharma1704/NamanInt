/**
 * Whether this browser runs WebGL 2 well enough for the site's WebGL line drawings.
 *
 * Three.js r163+ requires WebGL 2. A context the browser flags with a major performance caveat (software rendering)
 * is treated as absent.
 */
export function hasCapableWebGL2(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}
