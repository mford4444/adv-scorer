// Placeholder: Fetch FINRA profile or disclosures (mock or dummy object for now)
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
