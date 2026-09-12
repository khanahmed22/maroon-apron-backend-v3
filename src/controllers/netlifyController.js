import { updateNetlifyDomainAlias as updateAlias} from "../services/netlify.js";
const updateNetlifyDomainAlias = async (req, res, next) => {
  try {
    const { oldDomain, newDomain } = req.body;

    if (!newDomain) {
      return res.status(400).json({
        success: false,
        error: "newDomain is required",
      });
    }

    const domainAliases = await updateAlias(oldDomain, newDomain);

    return res.status(200).json({
      success: true,
      message: "Netlify domain alias updated successfully",
      domainAliases,
    });
  } catch (err) {
    next(err);
  }
};

export { updateNetlifyDomainAlias };