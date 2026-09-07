const { kv } = require("@vercel/kv");

const PROFILE_KEY = "divya-lab:profile";

function defaultProfile() {
  return {
    name: "Divya Chadha",
    title: "Applied AI Researcher & Engineer",
    image: "",
    tagline: "Turning experimental models into working prototypes, one careful iteration at a time.",
    quotes: {
      dedication: "I've come to believe good work is measured less by the hours put into it, and more by how deliberately those hours are spent.",
      enthusiasm: "Every new model, paper, or dataset is a doorway — I'd rather open ten of them and learn something from each than wait around for the perfect one."
    },
    jobProfile: "I work at the intersection of applied research and engineering, building generative AI systems that are meant to leave the lab and hold up in real use.",
    qualifications: [
      "M.Tech, Computer Science — Your Institute Name, 2020",
      "B.Tech, Information Technology — Your Institute Name, 2018"
    ],
    genai: [
      { id: 1, name: "Conversational Support Copilot", image: "", link: "#", description: "A retrieval-augmented assistant prototype built to draft first-response replies for support tickets." },
      { id: 2, name: "Document Intelligence Extractor", image: "", link: "#", description: "An LLM-based pipeline that pulls structured fields out of unstructured contracts and reports." }
    ],
    rad: [
      { id: 1, name: "Prompt Evaluation Framework", image: "", link: "#", description: "An internal harness for scoring prompt and model changes against a fixed set of test cases." },
      { id: 2, name: "Latency-Aware Model Routing", image: "", link: "#", description: "A routing layer that picks between models at request time based on cost, latency, and difficulty." }
    ],
    research: [
      { id: 1, name: "Reliability of Retrieval-Augmented Generation", image: "", link: "#", description: "A short study on where RAG pipelines tend to fail silently." },
      { id: 2, name: "Human-in-the-Loop Evaluation for GenAI Systems", image: "", link: "#", description: "Notes on designing review workflows that keep human judgment in the loop." }
    ]
  };
}

// Reads the profile from Vercel KV. Falls back to (and seeds) the default
// content on first run, since Vercel's function filesystem is ephemeral and
// can't be used for durable storage the way a normal disk file can.
async function readProfile() {
  const existing = await kv.get(PROFILE_KEY);
  if (existing) return existing;
  const def = defaultProfile();
  await kv.set(PROFILE_KEY, def);
  return def;
}

async function writeProfile(data) {
  await kv.set(PROFILE_KEY, data);
}

module.exports = { defaultProfile, readProfile, writeProfile };
