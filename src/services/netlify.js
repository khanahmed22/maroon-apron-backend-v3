const NETLIFY_API_BASE = "https://api.netlify.com/api/v1";

const getNetlifyConfig = () => ({
  siteId: process.env.NETLIFY_SITE_ID,
  token: process.env.NETLIFY_AUTH_TOKEN,
});

const getSiteAliases = async () => {
  const { siteId, token } = getNetlifyConfig();

  if (!siteId || !token) {
    throw Object.assign(new Error("Netlify configuration is missing"), { status: 500 });
  }

  const res = await fetch(`${NETLIFY_API_BASE}/sites/${siteId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  if (!res.ok) {
    throw Object.assign(new Error(data?.message || "Failed to get Netlify site"), { status: res.status });
  }

  return { siteId, token, aliases: data.domain_aliases || [] };
};

const setSiteAliases = async (siteId, token, domainAliases) => {
  const res = await fetch(`${NETLIFY_API_BASE}/sites/${siteId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ domain_aliases: domainAliases }),
  });
  const data = await res.json();

  if (!res.ok) {
    throw Object.assign(new Error(data?.message || "Failed to update Netlify domain alias"), { status: res.status });
  }

  return data.domain_aliases;
};

// Best-effort cleanup on downgrade — swallows errors, never throws.
const removeNetlifyAlias = async (domain) => {
  if (!domain) return;
  try {
    const { siteId, token, aliases } = await getSiteAliases();
    const domainAliases = aliases.filter((d) => d !== domain);
    if (domainAliases.length === aliases.length) return; // wasn't present, nothing to do
    await setSiteAliases(siteId, token, domainAliases);
  } catch (err) {
    console.error("Error removing Netlify alias", err);
  }
};

// Swaps oldDomain -> newDomain when a merchant sets/changes their custom domain.
// Throws on failure — the calling route decides the HTTP response.
const updateNetlifyDomainAlias = async (oldDomain, newDomain) => {
  const { siteId, token, aliases } = await getSiteAliases();

  const aliasesWithoutOld = oldDomain ? aliases.filter((d) => d !== oldDomain) : aliases;
  const domainAliases = aliasesWithoutOld.includes(newDomain)
    ? aliasesWithoutOld
    : [...aliasesWithoutOld, newDomain];

  return setSiteAliases(siteId, token, domainAliases);
};

export { removeNetlifyAlias, updateNetlifyDomainAlias };