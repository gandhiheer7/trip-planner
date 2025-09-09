// Trip Builder Application
class TripBuilder {
  constructor() {
    this.currentSection = "landing"
    this.tripData = {
      duration: 8,
      date: "",
      participants: 1,
      activities: [],
      designation: "",
      costs: {
        base: 0,
        activities: 0,
        total: 0,
      },
    }

    this.init()
  }

  init() {
    this.bindEvents()
    this.setMinDate()
  }

  bindEvents() {
    // Navigation
    document.getElementById("startPlanningBtn").addEventListener("click", () => {
      this.showSection("tripForm")
    })

    document.getElementById("backToFormBtn").addEventListener("click", () => {
      this.showSection("tripForm")
    })

    // Form interactions
    document.getElementById("calculateCostBtn").addEventListener("click", () => {
      this.calculateCost()
    })

    document.getElementById("viewSummaryBtn").addEventListener("click", () => {
      this.viewTripSummary()
    })

    document.getElementById("downloadPdfBtn").addEventListener("click", () => {
      this.downloadPDF()
    })

    // Form change listeners
    document.querySelectorAll('input[name="duration"]').forEach((radio) => {
      radio.addEventListener("change", (e) => {
        this.tripData.duration = Number.parseInt(e.target.value)
      })
    })

    document.getElementById("participants").addEventListener("input", (e) => {
      this.tripData.participants = Number.parseInt(e.target.value) || 1
    })

    document.getElementById("tripDate").addEventListener("change", (e) => {
      this.tripData.date = e.target.value
    })

    document.getElementById("designation").addEventListener("change", (e) => {
      this.tripData.designation = e.target.value
    })

    // Activity selection
    document.querySelectorAll('input[name="activities"]').forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        this.updateSelectedActivities()
      })
    })
  }

  setMinDate() {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const minDate = tomorrow.toISOString().split("T")[0]
    document.getElementById("tripDate").setAttribute("min", minDate)
  }

  showSection(sectionId) {
    document.querySelectorAll(".section").forEach((section) => {
      section.classList.remove("active")
    })
    document.getElementById(sectionId).classList.add("active")
    this.currentSection = sectionId
    window.scrollTo(0, 0)
  }

  updateSelectedActivities() {
    const selectedActivities = []
    document.querySelectorAll('input[name="activities"]:checked').forEach((checkbox) => {
      selectedActivities.push(checkbox.value)
    })
    this.tripData.activities = selectedActivities
  }

  validateForm() {
    const requiredFields = ["tripDate", "participants", "designation"]
    let isValid = true

    requiredFields.forEach((fieldId) => {
      const field = document.getElementById(fieldId)
      if (!field.value) {
        field.style.borderColor = "#ef4444"
        isValid = false
      } else {
        field.style.borderColor = "#e2e8f0"
      }
    })

    if (this.tripData.activities.length === 0) {
      alert("Please select at least one activity.")
      isValid = false
    }

    return isValid
  }

  // 🔹 Calls backend API for cost calculation
  async calculateCost() {
    if (!this.validateForm()) {
      return
    }

    try {
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration: this.tripData.duration,
          participants: this.tripData.participants,
          activities: this.tripData.activities,
          designation: this.tripData.designation,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to calculate cost")
      }

      const data = await response.json()

      this.tripData.costs = {
        base: data.base,
        activities: data.activities,
        total: data.total,
      }

      this.displayCostBreakdown(data.breakdown)
      this.generateItinerary()
    } catch (error) {
      console.error("Error calculating cost:", error)
      alert("Something went wrong while calculating the cost. Please try again.")
    }
  }

  displayCostBreakdown(breakdown = []) {
    const breakdownContainer = document.getElementById("breakdownDetails")
    if (breakdownContainer) {
      breakdownContainer.innerHTML = ""
      breakdown.forEach((item) => {
        const row = document.createElement("div")
        row.className = "breakdown-row"
        row.innerHTML = `<span>${item.label}</span><span>₹${item.value}</span>`
        breakdownContainer.appendChild(row)
      })
    }

    document.getElementById("baseCost").textContent = `₹${this.tripData.costs.base}`
    document.getElementById("activityCost").textContent = `₹${this.tripData.costs.activities}`
    document.getElementById("totalCost").textContent = `₹${Math.round(this.tripData.costs.total)}`

    document.getElementById("costBreakdown").classList.remove("hidden")
    document.getElementById("viewSummaryBtn").classList.remove("hidden")
  }

  generateItinerary() {
    const timelineContainer = document.getElementById("timelineContainer")
    timelineContainer.innerHTML = ""

    const duration = this.tripData.duration
    const activities = this.tripData.activities

    if (activities.length === 0) return

    const activityDetails = {
      sightseeing: { name: "Sightseeing Tour", description: "Explore local landmarks and attractions", duration: 2 },
      adventure: { name: "Adventure Activities", description: "Thrilling outdoor experiences", duration: 3 },
      teambuilding: { name: "Team Building", description: "Group activities and challenges", duration: 2 },
      cultural: { name: "Cultural Experience", description: "Museums and local culture", duration: 2 },
      meals: { name: "Meals & Refreshments", description: "Lunch and refreshment breaks", duration: 1 },
      transport: { name: "Transportation", description: "Round-trip transportation", duration: 1 },
    }

    let currentTime = 9
    const timeSlots = []

    timeSlots.push({
      time: this.formatTime(currentTime),
      activity: "Arrival & Setup",
      description: "Meet at designated location and brief overview",
    })
    currentTime += 0.5

    const availableTime = duration - 1
    const timePerActivity = availableTime / activities.length

    activities.forEach((activity) => {
      const details = activityDetails[activity]
      if (details) {
        timeSlots.push({
          time: this.formatTime(currentTime),
          activity: details.name,
          description: details.description,
        })
        currentTime += timePerActivity
      }
    })

    timeSlots.push({
      time: this.formatTime(9 + duration),
      activity: "Departure",
      description: "Trip conclusion and departure",
    })

    timeSlots.forEach((slot) => {
      const timelineItem = document.createElement("div")
      timelineItem.className = "timeline-item"
      timelineItem.innerHTML = `
        <div class="timeline-time">${slot.time}</div>
        <div class="timeline-activity">
            <h4>${slot.activity}</h4>
            <p>${slot.description}</p>
        </div>
      `
      timelineContainer.appendChild(timelineItem)
    })

    document.getElementById("itinerary").classList.remove("hidden")
  }

  formatTime(hour) {
    const h = Math.floor(hour)
    const m = Math.round((hour - h) * 60)
    const period = h >= 12 ? "PM" : "AM"
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`
  }

  generateSummary() {
    const summaryContent = document.getElementById("summaryContent")

    const date = new Date(this.tripData.date)
    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const activityNames = {
      sightseeing: "Sightseeing",
      adventure: "Adventure",
      teambuilding: "Team Building",
      cultural: "Cultural Experience",
      meals: "Meals",
      transport: "Transport",
    }

    summaryContent.innerHTML = `
      <div class="summary-grid">
          <div class="summary-item">
              <h4>Duration</h4>
              <div class="value">${this.tripData.duration} Hours</div>
          </div>
          <div class="summary-item">
              <h4>Date</h4>
              <div class="value">${formattedDate}</div>
          </div>
          <div class="summary-item">
              <h4>Participants</h4>
              <div class="value">${this.tripData.participants}</div>
          </div>
          <div class="summary-item">
              <h4>Total Cost</h4>
              <div class="value">₹${Math.round(this.tripData.costs.total)}</div>
          </div>
      </div>
      
      <div class="summary-activities">
          <h4>Selected Activities</h4>
          <div class="activity-tags">
              ${this.tripData.activities
                .map((activity) => `<span class="activity-tag">${activityNames[activity]}</span>`)
                .join("")}
          </div>
      </div>
    `
  }

  viewTripSummary() {
    this.generateSummary()
    this.showSection("summary")
    setTimeout(() => {
      document.getElementById("summary").scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

  downloadPDF() {
    alert(
      "PDF download functionality would be implemented here.\n\nThis would generate a detailed proposal including:\n- Trip itinerary\n- Cost breakdown\n- Activity details\n- Contact information",
    )

    const tripSummary = {
      date: this.tripData.date,
      duration: this.tripData.duration,
      participants: this.tripData.participants,
      activities: this.tripData.activities,
      totalCost: Math.round(this.tripData.costs.total),
      designation: this.tripData.designation,
    }

    console.log("Trip Summary for PDF:", tripSummary)

    const content = `
TRIP PROPOSAL
=============

Date: ${new Date(this.tripData.date).toLocaleDateString()}
Duration: ${this.tripData.duration} hours
Participants: ${this.tripData.participants}
Designation: ${this.tripData.designation}

Activities:
${this.tripData.activities.map((activity) => `- ${activity}`).join("\n")}

Total Cost: ₹${Math.round(this.tripData.costs.total)}

Generated on: ${new Date().toLocaleString()}
    `

    const blob = new Blob([content], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `trip-proposal-${this.tripData.date}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new TripBuilder()
})

function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

function smoothScrollTo(element) {
  element.scrollIntoView({ behavior: "smooth", block: "start" })
}
