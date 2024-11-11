// Convert JSON string to object
const predefinedKernelsObj = JSON.parse(predefinedKernels)

// Select the form to select filters
const kernelSelectForm = document.getElementById("kernelSelectForm")
const kernelSelect = document.getElementById("kernelSelect")
const kernelDisplay = document.getElementById("kernelDisplay")
const outputImage = document.getElementById("outputImg")

const updateKernelDisplay = () => {
    kernelDisplay.replaceChildren()

    // Get the name of the selected kernel and it's weights
    const selectedKernelName = kernelSelect.value
    const selectedKernelWeights = predefinedKernelsObj[selectedKernelName]

    // Create table rows/td elements to display the kernel
    for (const row in selectedKernelWeights) {
        const tableRow = document.createElement("tr")
        
        for (const col in selectedKernelWeights) {
            const kernelWeightHolder = document.createElement("td") 
            kernelWeightHolder.textContent = selectedKernelWeights[row][col]
            tableRow.appendChild(kernelWeightHolder) 
        }

        kernelDisplay.appendChild(tableRow)
    }
}

// Show the initial kernel weights of the initial kernel selection which is "IDENTITY"
updateKernelDisplay()

kernelSelect.addEventListener("change", () => {
    updateKernelDisplay()
})

kernelSelectForm.addEventListener("submit", (event) => {
    // Prevent default action
    event.preventDefault()

    const formData = new FormData(kernelSelectForm)
    const selectedKernel = formData.get("kernel")

    fetch("/", {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ kernel: selectedKernel })
    })
    .then(response => response.json())
    .then(data => {
            document.getElementById("outputImg").src = "data:image/jpeg;base64," + data.img_data
        })
    .catch(error => console.error("Error:", error))
})
