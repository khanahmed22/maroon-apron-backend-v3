const updateNetlifyDomainAlias = async (req, res, next) => {
  try {
    const { oldDomain, newDomain } = req.body;

    if (!newDomain) {
      return res.status(400).json({
        success: false,
        error: "newDomain is required",
      });
    }

    const siteId = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;

    if (!siteId || !token) {
      return res.status(500).json({
        success: false,
        error: "Netlify configuration is missing",
      });
    }

    // Get current Netlify site configuration
    const siteResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const siteData = await siteResponse.json();

    if (!siteResponse.ok) {
      const error = new Error(
        siteData?.message || "Failed to get Netlify site"
      );

      error.status = siteResponse.status;
      throw error;
    }

    const currentAliases = siteData.domain_aliases || [];

    // Remove old alias if provided
    const aliasesWithoutOld = oldDomain
      ? currentAliases.filter((domain) => domain !== oldDomain)
      : currentAliases;

    // Don't add duplicate
    const domainAliases = aliasesWithoutOld.includes(newDomain)
      ? aliasesWithoutOld
      : [...aliasesWithoutOld, newDomain];

    // Update Netlify site
    const updateResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain_aliases: domainAliases,
        }),
      }
    );

    const updatedSite = await updateResponse.json();

    if (!updateResponse.ok) {
      const error = new Error(
        updatedSite?.message || "Failed to update Netlify domain alias"
      );

      error.status = updateResponse.status;
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: "Netlify domain alias updated successfully",
      domainAliases: updatedSite.domain_aliases,
    });
  } catch (err) {
    next(err);
  }
};

export { updateNetlifyDomainAlias };