// api/calculate.js
export default function handler(req, res) {
  if (req.method === "POST") {
    const { duration, participants, activities } = req.body;

    const baseCosts = { 8: 50, 10: 100 };
    const activityPrices = {
      sightseeing: 25,
      adventure: 45,
      teambuilding: 35,
      cultural: 30,
      meals: 20,
      transport: 15,
    };

    const breakdown = [];

    // Base cost
    const basePerPerson = baseCosts[duration] || 0;
    const baseTotal = basePerPerson * participants;
    breakdown.push({
      label: `Base Cost (${participants} × ₹${basePerPerson})`,
      value: baseTotal,
    });

    // Activities
    let activityTotal = 0;
    activities.forEach((a) => {
      const perPerson = activityPrices[a] || 0;
      const total = perPerson * participants;
      activityTotal += total;
      breakdown.push({
        label: `${a.charAt(0).toUpperCase() + a.slice(1)} (${participants} × ₹${perPerson})`,
        value: total,
      });
    });

    const total = baseTotal + activityTotal;

    return res.status(200).json({
      baseCost: baseTotal,
      activityCost: activityTotal,
      total,
      breakdown,
    });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
