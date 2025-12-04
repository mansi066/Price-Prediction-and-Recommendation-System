// Get modal elements
const modal = document.getElementById("predictionModal")
const predictBtn = document.getElementById("predictBtn")
const navPredictBtn = document.getElementById("navPredictBtn")
const closeBtn = document.getElementById("closeBtn")
const closeFormBtn = document.getElementById("closeFormBtn")
const predictionForm = document.getElementById("predictionForm")

const openModal = () => {
  modal.classList.add("active")
  document.body.style.overflow = "hidden"
}

// Open modal from hero button
predictBtn.addEventListener("click", openModal)

navPredictBtn.addEventListener("click", (e) => {
  e.preventDefault()
  openModal()
})

// Close modal
const closeModal = () => {
  modal.classList.remove("active")
  document.body.style.overflow = "auto"
}

closeBtn.addEventListener("click", closeModal)
closeFormBtn.addEventListener("click", closeModal)

// Close modal when clicking outside
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal()
  }
})

// Handle form submission
predictionForm.addEventListener("submit", (e) => {
  e.preventDefault()

  // Get form values
  const propertyType = document.getElementById("propertyType").value
  const location = document.getElementById("location").value
  const bathrooms = document.getElementById("bathrooms").value
  const kitchens = document.getElementById("kitchens").value
  const floors = document.getElementById("floors").value

  // Log the prediction (in a real app, this would send to a server)
  console.log("Property Prediction:", {
    propertyType,
    location,
    bathrooms,
    kitchens,
    floors,
  })

  // Show success message
  alert(
    `Prediction submitted for ${propertyType} in ${location}!\n\nEstimated Price: $${Math.floor(Math.random() * 500000 + 200000).toLocaleString()}`,
  )

  // Reset form and close modal
  predictionForm.reset()
  closeModal()
})

// Keyboard shortcut to close modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal()
  }
})
