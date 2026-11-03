import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_AUTHOR_ID = "AnztMl4AAAAJ";
const DEFAULT_CONTENT_PATH = "content.json";

function normalizeTitle(value = "") {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function citationIdFromUrl(value = "") {
  try {
    return new URL(value).searchParams.get("citation_for_view") || "";
  } catch {
    return "";
  }
}

function updateCitationNote(note, citationCount) {
  const parts = String(note || "")
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^cited by\s+\d+$/i.test(part));

  if (Number.isFinite(citationCount) && citationCount > 0) {
    parts.push(`Cited by ${citationCount}`);
  }

  return parts.join(" · ");
}

function asPublication(article) {
  const citationCount = Number(article?.cited_by?.value ?? 0);

  return {
    year: String(article?.year || ""),
    title: String(article?.title || "").trim(),
    authors: String(article?.authors || "").trim(),
    venue: String(article?.publication || "").trim(),
    note: citationCount > 0 ? `Cited by ${citationCount}` : "",
    href: String(article?.link || "").trim(),
  };
}

export function updatePublications(content, scholarPayload) {
  const scholarArticles = Array.isArray(scholarPayload?.articles)
    ? scholarPayload.articles.filter((article) => article?.title)
    : [];

  if (scholarArticles.length === 0) {
    throw new Error("SerpAPI returned no Google Scholar articles; content was not changed.");
  }

  const existing = Array.isArray(content?.publications) ? content.publications : [];
  const byCitationId = new Map();
  const byTitle = new Map();

  existing.forEach((publication, index) => {
    const citationId = citationIdFromUrl(publication?.href);
    const title = normalizeTitle(publication?.title);
    if (citationId) byCitationId.set(citationId, { publication, index });
    if (title) byTitle.set(title, { publication, index });
  });

  const matchedExisting = new Set();
  const merged = scholarArticles.map((article, sourceOrder) => {
    const citationId = String(article?.citation_id || "");
    const title = normalizeTitle(article?.title);
    const match = byCitationId.get(citationId) || byTitle.get(title);
    const citationCount = Number(article?.cited_by?.value ?? 0);

    if (!match) {
      return { publication: asPublication(article), sourceOrder };
    }

    matchedExisting.add(match.index);
    return {
      publication: {
        ...match.publication,
        year: String(article?.year || match.publication.year || ""),
        note: updateCitationNote(match.publication.note, citationCount),
      },
      sourceOrder,
    };
  });

  existing.forEach((publication, index) => {
    if (!matchedExisting.has(index)) {
      merged.push({ publication, sourceOrder: scholarArticles.length + index });
    }
  });

  merged.sort((left, right) => {
    const yearDifference = Number(right.publication.year || 0) - Number(left.publication.year || 0);
    return yearDifference || left.sourceOrder - right.sourceOrder;
  });

  return {
    ...content,
    publications: merged.map(({ publication }) => publication),
  };
}

async function fetchScholarProfile(apiKey, authorId) {
  const endpoint = new URL("https://serpapi.com/search.json");
  endpoint.searchParams.set("engine", "google_scholar_author");
  endpoint.searchParams.set("author_id", authorId);
  endpoint.searchParams.set("hl", "en");
  endpoint.searchParams.set("sort", "pubdate");
  endpoint.searchParams.set("num", "100");
  endpoint.searchParams.set("api_key", apiKey);

  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
  });
  const payload = await response.json();

  if (!response.ok || payload?.error) {
    throw new Error(payload?.error || `SerpAPI request failed with HTTP ${response.status}.`);
  }

  return payload;
}

async function main() {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    throw new Error("SERPAPI_KEY is missing. Add it as a GitHub Actions repository secret.");
  }

  const contentPath = resolve(process.env.CONTENT_PATH || DEFAULT_CONTENT_PATH);
  const authorId = process.env.SCHOLAR_AUTHOR_ID || DEFAULT_AUTHOR_ID;
  const content = JSON.parse(await readFile(contentPath, "utf8"));
  const scholarPayload = await fetchScholarProfile(apiKey, authorId);
  const updated = updatePublications(content, scholarPayload);
  const before = JSON.stringify(content, null, 2) + "\n";
  const after = JSON.stringify(updated, null, 2) + "\n";

  if (before === after) {
    console.log("Google Scholar data is already current.");
    return;
  }

  await writeFile(contentPath, after, "utf8");
  console.log(`Updated ${updated.publications.length} publications from Google Scholar.`);
}

const isMain = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href === import.meta.url
  : false;

if (isMain) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
