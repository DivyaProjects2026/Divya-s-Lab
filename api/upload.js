const { put } = require("@vercel/blob");
const { isAuthenticated, readJsonBody } = require("./_lib/auth");

const MAX_BYTES = 4 * 1024 * 1024; // ~4MB raw file; base64 body stays under Vercel's ~4.5MB request limit

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const { filename, dataUrl } = body || {};
  if (!filename || !dataUrl) {
    return res.status(400).json({ error: "Missing filename or dataUrl" });
  }

  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  if (!match) {
    return res.status(400).json({ error: "Invalid image data" });
  }
  const contentType = match[1];
  if (!contentType.startsWith("image/")) {
    return res.status(400).json({ error: "Only image files are allowed" });
  }

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_BYTES) {
    return res.status(400).json({ error: "Image is too large (max 4MB)" });
  }

  try {
    const blob = await put(filename, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: true
    });
    return res.status(200).json({ url: blob.url });
  } catch (e) {
    return res.status(500).json({ error: "Upload failed: " + (e && e.message ? e.message : "unknown error") });
  }
};
