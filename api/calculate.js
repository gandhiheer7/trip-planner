// api/calculate.js
export default function handler(req, res) {
  if (req.method === "POST") {
    const { duration, participants, activities, designation } = req.body;

    // Example cost logic (same as in script.js)
    const baseCosts = { 8: 50, 10: 100 };
    const activityPrices = {
      sightseeing: 25,
      adventure: 45,
      teambuilding: 35,
      cultural: 30,
      meals: 20,
      transport: 15,
    };

    const baseCost = baseCosts[duration] * participants;
    let activityCost = 0;
    activities.forEach((a) => {
      activityCost += activityPrices[a] * participants;
    });

    const total = baseCost + activityCost;

    res.status(200).json({
      baseCost,
      activityCost,
      total,
    });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
