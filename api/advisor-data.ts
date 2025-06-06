// /api/advisor-data.ts

export default async function handler(req: any, res: any) {
  const { crd } = req.query;

  if (!crd || typeof crd !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid CRD number' });
  }

  try {
    // Temporarily using dummy data to avoid fetch errors
    const secJson = {
      name: "Test Advisor",
      firm: {
        crd: "304390",
        name: "Alyphyn Capital Management"
      },
      aum: "$50M+"
    };

    const finraSummary = {
      disclosures: 0,
      licenses: ['Series 65'],
      bdAffiliated: false,
    };

    const responsePayload = {
      advisorCRD: crd,
      advisorName: secJson?.name || 'N/A',
      firmCRD: secJson?.firm?.crd || 'N/A',
      firmName: secJson?.firm?.name || 'N/A',
      aum: secJson?.aum || 'Unknown',
      advPart2Url: `https://adviserinfo.sec.gov/individual/${crd}`,
      finra: finraSummary,
    };

    return res.status(200).json(responsePayload);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch advisor data' });
  }
}
