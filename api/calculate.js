// api/calculateCost.js
export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { duration, participants, activities } = req.body

  const activityPrices = {
    sightseeing: 25,
    adventure: 45,
    teambuilding: 35,
    cultural: 30,
    meals: 20,
    transport: 15,
  }

  const baseCosts = {
    8: 50,
    10: 100,
  }

  const breakdown = []

  // Base cost
  const basePerPerson = baseCosts[duration] || 0
  const baseTotal = basePerPerson * participants
  breakdown.push({
    label: `Base Cost (${participants} × ₹${basePerPerson})`,
    value: baseTotal,
  })

  // Activities
  let activityTotal = 0
  activities.forEach((activity) => {
    const costPerPerson = activityPrices[activity] || 0
    const total = costPerPerson * participants
    activityTotal += total
    breakdown.push({
      label: `${activity.charAt(0).toUpperCase() + activity.slice(1)} (${participants} × ₹${costPerPerson})`,
      value: total,
    })
  })

  const totalCost = baseTotal + activityTotal

  return res.status(200).json({
    base: baseTotal,
    activities: activityTotal,
    total: totalCost,
    breakdown,
  })
}
