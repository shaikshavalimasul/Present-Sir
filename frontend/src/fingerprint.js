// Generates a unique device fingerprint hash using multiple browser properties + canvas
export async function getFingerprint() {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    navigator.platform || "",
    navigator.maxTouchPoints || 0,
    _getCanvasFingerprint(),
  ];
  const raw = components.join("|||");
  const hash = await _sha256(raw);
  return hash;
}

function _getCanvasFingerprint() {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("SmartAttendance🎓", 2, 15);
    ctx.fillStyle = "rgba(102,204,0,0.7)";
    ctx.fillText("SmartAttendance🎓", 4, 17);
    return canvas.toDataURL();
  } catch {
    return "no-canvas";
  }
}

async function _sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
