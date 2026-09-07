const { readProfile, writeProfile } = require("./_lib/store");
const { isAuthenticated, readJsonBody } = require("./_lib/auth");

module.exports = async (req, res) => {
  if (req.method === "GET") {
    const profile = await readProfile();
    return res.status(200).json(profile);
  }

  if (req.method === "PUT") {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    let body;
    try {
      body = await readJsonBody(req);
    } catch (e) {
      return res.status(400).json({ error: "Invalid JSON" });
    }
    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "Invalid payload" });
    }
    await writeProfile(body);
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, PUT");
  return res.status(405).json({ error: "Method not allowed" });
};
