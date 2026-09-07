const { defaultProfile, writeProfile } = require("../_lib/store");
const { isAuthenticated } = require("../_lib/auth");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const def = defaultProfile();
  await writeProfile(def);
  return res.status(200).json(def);
};
