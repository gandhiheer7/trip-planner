// Trip Builder Application
class TripBuilder {
  constructor() {
    this.currentSection = "landing";
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
    };

    this.init();
  }

  init() {
    this.bindEvents();
    this.setMinDate();
  }

  bindEvents() {
    document.getElementById("startPlanningBtn").addEventListener("click", () => {
      this.showSection("tripForm");
    });

    document.getElementById("backToFormBtn").addEventListener("click", () => {
      this.showSection("tripForm");
    });

    document.getElementById("calculateCostBtn").addEventListener("click", () => {
      this.calculateCost();
    });

    document.getElementById("viewSummaryBtn").addEventListener("click", () => {
      this.viewTripSummary();
    });

    document.getElementById("downloadPdfBtn").addEventListener("click", () => {
      this.downloadPDF();
    });

    document.querySelectorAll('input[name="duration"]').forEach((radio) => {
      radio.addEventListener("change", (e) => {
        this.tripData.duration = Number.parseInt(e.target.value);
      });
    });

    document.getElementById("participants").addEventListener("input", (e) => {
      this.tripData.participants = Number.parseInt(e.target.value) || 1;
    });

    document.getElementById("tripDate").addEventListener("change", (e) => {
      this.tripData.date = e.target.value;
    });

    document.getElementById("designation").addEventListener("change", (e) => {
      this.tripData.designation = e.target.value;
    });

    document.getElementById("customNotes").addEventListener("input", (e) => {
      this.tripData.customNotes = e.target.value;
    });

    document.querySelectorAll('input[name="activities"]').forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        this.updateSelectedActivities();
      });
    });
  }

  setMinDate() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const minDate = tomorrow.toISOString().split("T")[0];
    document.getElementById("tripDate").setAttribute("min", minDate);
  }

  showSection(sectionId) {
    document.querySelectorAll(".section").forEach((section) => {
      section.classList.remove("active");
    });
    document.getElementById(sectionId).classList.add("active");
    this.currentSection = sectionId;
    window.scrollTo(0, 0);
  }

  updateSelectedActivities() {
    const selectedActivities = [];
    document.querySelectorAll('input[name="activities"]:checked').forEach((checkbox) => {
      selectedActivities.push(checkbox.value);
    });
    this.tripData.activities = selectedActivities;
  }

  validateForm() {
    const requiredFields = ["tripDate", "participants", "designation"];
    let isValid = true;

    requiredFields.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (!field.value) {
        field.style.borderColor = "#ef4444";
        isValid = false;
      } else {
        field.style.borderColor = "#e2e8f0";
      }
    });

    if (this.tripData.activities.length === 0) {
      alert("Please select at least one activity.");
      isValid = false;
    }

    return isValid;
  }

  async calculateCost() {
    if (!this.validateForm()) return;

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
      });

      if (!response.ok) throw new Error("Failed to calculate cost");

      const data = await response.json();
      this.tripData.costs = {
        base: data.baseCost,
        activities: data.activityCost,
        total: data.total,
      };

      this.displayCostBreakdown();
      this.generateItinerary();
    } catch (error) {
      console.error("Error calculating cost:", error);
      alert("Something went wrong while calculating the cost. Please try again.");
    }
  }

  displayCostBreakdown() {
    document.getElementById("baseCost").textContent = `₹${this.tripData.costs.base}`;
    document.getElementById("activityCost").textContent = `₹${this.tripData.costs.activities}`;
    document.getElementById("totalCost").textContent = `₹${Math.round(this.tripData.costs.total)}`;

    document.getElementById("costBreakdown").classList.remove("hidden");
    document.getElementById("viewSummaryBtn").classList.remove("hidden");
  }

  generateItinerary() {
    const timelineContainer = document.getElementById("timelineContainer");
    timelineContainer.innerHTML = "";

    if (this.tripData.activities.length === 0) return;

    const timeSlots = this.createItinerarySlots(); // Use the new helper

    timeSlots.forEach((slot) => {
      const timelineItem = document.createElement("div");
      timelineItem.className = "timeline-item";
      timelineItem.innerHTML = `
        <div class="timeline-time">${slot.time}</div>
        <div class="timeline-activity">
            <h4>${slot.activity}</h4>
            <p>${slot.description}</p>
        </div>
      `;
      timelineContainer.appendChild(timelineItem);
    });

    document.getElementById("itinerary").classList.remove("hidden");
  }

  formatTime(hour) {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`;
  }

  viewTripSummary() {
    this.generateSummary();
    this.showSection("summary");
  }

  generateSummary() {
    const summaryContent = document.getElementById("summaryContent");
    const date = new Date(this.tripData.date);
    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const activityNames = {
      sightseeing: "Sightseeing",
      adventure: "Adventure",
      teambuilding: "Team Building",
      cultural: "Cultural Experience",
      meals: "Meals",
      transport: "Transport",
    };

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
    `;

    if (this.tripData.customNotes && this.tripData.customNotes.trim() !== "") {
      summaryContent.innerHTML += `
        <div class="summary-item">
            <h4>Special Requests</h4>
            <div class="value">${this.tripData.customNotes}</div>
        </div>
      `;
    }
  }

  // 🔹 Generate a professional PDF with jsPDF
  async downloadPDF() {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // === Company Header ===
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor("#1e293b");
      doc.text("Trip Proposal", 105, 22, { align: "center" });

      const companyLogoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAARJSURBVHhe7Z1/aBRBGMd/JwgiuBG0UhFRsFAENf5AFBvBRdpeK1hprPQHhXhxEAsptLQxgoVgIYKFomilYGEjCmqN7UWxVzGgVBQtCioe3Nn9P7e7m917s7v5vP/ywcLszv7nO/t2d2eXERERERERERERERERESkpz03z3k6w8/lQfHrEu+Nxuwz33+l3b/q3KqFnh217S0+LDCUeS1w/mG8n3F2K/3/Eew+2G+7/vU1Xh3sP1hvuP9jvtkz/j4VvX3G/F8c/t/z7j/bfvP/V+/w+2v+P+P/z4R/PP6a59w9x/1H/L/T/Xw9+f/n3D/a/vP/V+/xG27/t/17w7z/t/1n/r/S/q4b/f+XfP9r/8/6X9d8k+NeP/z/i/8+Hfzz/muffPf7/if8/G/7x/Guff/f4/yP+P5/w/8v/P+D/z4f/PP+Z599j/M8n/v98w/8v//+A//8m/P/y/w/4/5nw/8v/P+D/z4f/PP+Z599j/M8n/v98w/8v//+A//8m/P/y/w/4/5nw/8v/P+D/z4f/PP+Z599j/M8n/v98w/8v//+A//8m/P/y/w/4/5nw/8v/P+D/z4f/PP+Z599j/M8n/v98w/8v//+A//8m/P/y/w/4/5nw/8v/P+D/z4f/PP+Z599j/M8n/v98w/8v//+A//8m/P/y/w/4/5nw/8v/P+D/z4f/PP+Z599j/M8n/v98w/8v//+A//8m/P/y/w/4/5nw/8v/P+D/z4f/PP+Z5989/v+J/z8b/vH8a55/9/j/I/7/fML/L/+/gP8/H/7x/Guffvb4/zP+/x3+/wr/vzj8/8D/nx3++Pz7j/bfvP/V+/w+2v+P+P/z4R/PP6a59w9x/1H/L/T/Xw9+f/n3D/a/vP/V+/xG27/t/17w7z/t/1n/r/S/q4b/f+XfP9r/8/6X9V8k+NeP/z/i/8+Hfzz/muffPf7/if8/G/7x/Guff/f4/yP+/3zC/y//v4D/Px/+8fxrnn2P8T+f+P/zDf+//P8D/v9N+P/l/x/w/2bC/y//v4D/Px/+8fxrnn2P8T+f+P/zDf+//P8D/v9N+P/l/x/w/2bC/y//v4D/Px/+8fxrnn2P8T+f+P/zDf+//P8D/v9N+P/l/x/w/2bC/y//v4D/Px/+8fxrnn2P8T+f+P/zDf+//P8D/v9N+P/l/x/w/2bC/y//v4D/Px/+8fxrnn2P8T+f+P/zDf+//P8D/v9N+P/l/x/w/2bC/y//v4D/Px/+8fxrnn2P8T+f+P/zDf+//P8D/v9N+P/l/x/w/2bC/y//v4D/Px/+8fxrnn33+P8n/v9swv8v//8A//8u/P/y/w/4/zPh/5f/f4D/Px/+8fxrnn33+P8n/v9swv8v//8A//8u/P/y/w/4/zPh/5f/f4D/P49I/Lg3y7f3uL479L/T9Pz0eH/XzLhS8Lz47S7//vB8d+l54zR+V/58p3h8l/d/n//V+/z1O/3/iP8/P//T4b7z51xpuL1l9f1u+O8b3q2K/z/n/4X/Hx3+8fT/1/w23L+0+v41+N9zPDvX6H/XvV/D/w+H70+775bL8e/V9U+l+m9c5j7/X2G+8+2v5vB/0v+321/t/t/171f+6/XyoiIiIiIiIiIiIiIiLSjf4C6d5ZJ/C01bIAAAAASUVORK5CYII=";
      doc.addImage(companyLogoBase64, "PNG", 14, 15, 20, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor("#64748b");
      doc.text("Generated on: " + new Date().toLocaleDateString(), 195, 22, { align: "right" });

      doc.setDrawColor("#e2e8f0");
      doc.line(15, 30, 195, 30); // Horizontal line

      // === Trip Details ===
      let yPosition = 40;
      const writeLine = (label, value) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, 20, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(String(value), 60, yPosition);
        yPosition += 8;
      };

      writeLine("Date:", new Date(this.tripData.date).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }));
      writeLine("Duration:", `${this.tripData.duration} hours`);
      writeLine("Participants:", `${this.tripData.participants}`);
      yPosition += 5;

      // === Cost Breakdown ===
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Cost Breakdown", 20, yPosition);
      yPosition += 10;
      doc.setFontSize(11);

      writeLine("Base Cost:", `₹${this.tripData.costs.base.toLocaleString()}`);
      writeLine("Activity Costs:", `₹${this.tripData.costs.activities.toLocaleString()}`);
      doc.setFont("helvetica", "bold");
      writeLine("Total Cost:", `₹${Math.round(this.tripData.costs.total).toLocaleString()}`);
      yPosition += 10;

      // === Itinerary ===
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Proposed Itinerary", 20, yPosition);
      yPosition += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const itinerarySlots = this.createItinerarySlots();
      itinerarySlots.forEach(slot => {
        if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.text(slot.time, 25, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(`${slot.activity}: ${slot.description}`, 55, yPosition, { maxWidth: 140 });
        yPosition += 10;
      });

      // === Footer ===
      doc.setDrawColor("#e2e8f0");
      doc.line(15, 285, 195, 285);
      doc.setFontSize(9);
      doc.setTextColor("#64748b");
      doc.text("Thank you for choosing us for your trip planning!", 105, 290, { align: "center" });
      
      doc.save(`trip-proposal-${this.tripData.date}.pdf`);

    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Oops! Something went wrong while creating the PDF. Please try again.");
    }
  }

  createItinerarySlots() {
    const duration = this.tripData.duration;
    const activities = this.tripData.activities;
    const timeSlots = [];

    const activityDetails = {
      sightseeing: { name: "Sightseeing Tour", description: "Explore local landmarks and attractions" },
      adventure: { name: "Adventure Activities", description: "Thrilling outdoor experiences" },
      teambuilding: { name: "Team Building", description: "Group activities and challenges" },
      cultural: { name: "Cultural Experience", description: "Museums and local culture" },
      meals: { name: "Meals & Refreshments", description: "Lunch and refreshment breaks" },
      transport: { name: "Transportation", description: "Arrival and departure logistics" },
    };

    let currentTime = 9;
    timeSlots.push({
      time: this.formatTime(currentTime),
      activity: "Arrival & Welcome",
      description: "Meet at the designated location for a brief overview.",
    });
    currentTime += 0.5;

    if (activities.length > 0) {
      const availableTime = duration - 1.5;
      const timePerActivity = availableTime / activities.length;

      activities.forEach((activity) => {
        const details = activityDetails[activity];
        if (details) {
          timeSlots.push({
            time: this.formatTime(currentTime),
            activity: details.name,
            description: details.description,
          });
          currentTime += timePerActivity;
        }
      });
    }

    timeSlots.push({
      time: this.formatTime(9 + duration),
      activity: "Departure",
      description: "Trip conclusion and departure.",
    });

    return timeSlots;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new TripBuilder();
});

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function smoothScrollTo(element) {
  element.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}