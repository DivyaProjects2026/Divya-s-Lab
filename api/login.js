const bcrypt = require("bcryptjs");
const { signSessionCookie, readJsonBody } = require("./_lib/auth");

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!ADMIN_PASSWORD_HASH) {
    return res.status(500).json({ error: "Server has no ADMIN_PASSWORD_HASH configured yet." });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const { password } = body || {};
  const ok = password && (await bcrypt.compare(password, ADMIN_PASSWORD_HASH));
  if (!ok) return res.status(401).json({ error: "Wrong password" });

  signSessionCookie(res);
  return res.status(200).json({ ok: true });
};
