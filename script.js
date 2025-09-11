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
      customNotes: "",
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
    document.getElementById("startPlanningBtn").addEventListener("click", () => {
      this.showSection("tripForm")
    })

    document.getElementById("backToFormBtn").addEventListener("click", () => {
      this.showSection("tripForm")
    })

    document.getElementById("calculateCostBtn").addEventListener("click", () => {
      this.calculateCost()
    })

    document.getElementById("viewSummaryBtn").addEventListener("click", () => {
      this.viewTripSummary()
    })

    document.getElementById("downloadPdfBtn").addEventListener("click", () => {
      this.downloadPDF()
    })

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

    document.getElementById("customNotes").addEventListener("input", (e) => {
      this.tripData.customNotes = e.target.value
    })

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

  async calculateCost() {
    if (!this.validateForm()) return

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

      if (!response.ok) throw new Error("Failed to calculate cost")

      const data = await response.json()
      this.tripData.costs = {
        base: data.baseCost,
        activities: data.activityCost,
        total: data.total,
      }

      this.displayCostBreakdown()
      this.generateItinerary()
    } catch (error) {
      console.error("Error calculating cost:", error)
      alert("Something went wrong while calculating the cost. Please try again.")
    }
  }

  displayCostBreakdown() {
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

    if (this.tripData.customNotes && this.tripData.customNotes.trim() !== "") {
      summaryContent.innerHTML += `
        <div class="summary-item">
            <h4>Special Requests</h4>
            <div class="value">${this.tripData.customNotes}</div>
        </div>
      `
    }
  }

  // 🔹 Generate a professional PDF with jsPDF
  async downloadPDF() {
    const { jsPDF } = window.jspdf
    const doc = new jsPDF()

    // === Company Header ===
    const companyName = "Your Company Name"
    const companyLogo = "https://via.placeholder.com/100" // replace with logo URL or base64
    doc.setFontSize(18)
    doc.text(companyName, 20, 20)

    // Load logo image
    try {
      const img = new Image()
      img.src = companyLogo
      await new Promise((resolve) => {
        img.onload = resolve
      })
      doc.addImage(img, "PNG", 150, 10, 40, 20)
    } catch (err) {
      console.warn("Logo not loaded, skipping...")
    }

    // === Trip Details ===
    doc.setFontSize(12)
    doc.text(`Date: ${new Date(this.tripData.date).toLocaleDateString()}`, 20, 40)
    doc.text(`Duration: ${this.tripData.duration} hours`, 20, 50)
    doc.text(`Participants: ${this.tripData.participants}`, 20, 60)
    doc.text(`Designation: ${this.tripData.designation}`, 20, 70)

    // Special Requests
    const notes = this.tripData.customNotes || "None"
    doc.text("Special Requests:", 20, 85)
    doc.text(notes, 20, 95, { maxWidth: 170 })

    // === Cost Breakdown ===
    doc.text("Cost Breakdown:", 20, 115)
    doc.text(`Base Cost: ₹${this.tripData.costs.base}`, 30, 125)
    doc.text(`Activity Costs: ₹${this.tripData.costs.activities}`, 30, 135)
    doc.text(`Total Cost: ₹${Math.round(this.tripData.costs.total)}`, 30, 145)

    // === Itinerary ===
    doc.text("Itinerary Timeline:", 20, 165)
    const timelineContainer = document.querySelectorAll(".timeline-item")
    timelineContainer.forEach((item, index) => {
      const time = item.querySelector(".timeline-time").textContent.trim()
      const activity = item.querySelector("h4").textContent.trim()
      const description = item.querySelector("p").textContent.trim()
      doc.setFontSize(10)
      doc.text(`${time} - ${activity}: ${description}`, 25, 175 + index * 10, { maxWidth: 170 })
    })

    // Footer
    doc.setFontSize(10)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 280)

    doc.save(`trip-proposal-${this.tripData.date}.pdf`)
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
  element.scrollIntoView({
    behavior: "smooth",
    block: "start",
  })
}
