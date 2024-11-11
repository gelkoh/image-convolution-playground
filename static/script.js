// Convert JSON string to object
const predefinedKernelsObj = JSON.parse(predefinedKernels)

// Select the form to select filters
const kernelSelectForm = document.getElementById("kernelSelectForm")
const kernelSelect = document.getElementById("kernelSelect")
const kernelDisplay = document.getElementById("kernelDisplay")
const outputImage = document.getElementById("outputImg")

const updateKernelDisplay = () => {
    kernelDisplay.replaceChildren()

    // Get the name of the selected kernel
    const selectedKernelName = kernelSelect.value
    let selectedKernelWeights

    if (selectedKernelName === "CUSTOM") {
       selectedKernelWeights = [
            [0, 0, 0],
            [0, 1, 0],
            [0, 0, 0]
        ]  
    } else {
        selectedKernelWeights = predefinedKernelsObj[selectedKernelName]
    }

    // const selectedKernelWeights = predefinedKernelsObj[selectedKernelName]

    // Create table rows/td elements to display the kernel
    for (const row in selectedKernelWeights) {
        const tableRow = document.createElement("tr")
        
        for (const col in selectedKernelWeights) {
            const tableCell = document.createElement("td")
            const weightInput = document.createElement("input")
            weightInput.setAttribute("type", "number")

            weightInput.value = selectedKernelWeights[row][col]

            tableCell.appendChild(weightInput)
            tableRow.appendChild(weightInput) 
        }

        kernelDisplay.appendChild(tableRow)
    }
}

// Show the initial kernel weights of the initial kernel selection which is "IDENTITY"
updateKernelDisplay()

const getKernelValues = () => {
    const tableRows = kernelDisplay.querySelectorAll("tr")

    const kernelWeights = []

    for (let i = 0; i < tableRows.length; i++) {
        const weightInputs = tableRows[i].querySelectorAll("input")
        const weightsRow = []

        for (let j = 0; j < weightInputs.length; j++) {
           weightsRow.push(weightInputs[j].value) 
        }

        kernelWeights.push(weightsRow)
    }

    return kernelWeights
}

kernelSelect.addEventListener("change", () => {
    updateKernelDisplay()
})

kernelSelectForm.addEventListener("submit", (event) => {
    // Prevent default action
    event.preventDefault()

    const formData = new FormData(kernelSelectForm)
    const selectedKernelName = formData.get("kernel")

    let data
    let customKernelValues

    if (selectedKernelName === "CUSTOM") { 
        customKernelValues = getKernelValues()
        data = { selectedKernelName: selectedKernelName, customKernelValues: customKernelValues }
    } else {
        data = { selectedKernelName: selectedKernelName }
    }

    fetch("/", {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ selectedKernelName: selectedKernelName, customKernelValues: customKernelValues })
    })
    .then(response => response.json())
    .then(data => {
            outputImg.src = "data:image/jpeg;base64," + data.img_data
        })
    .catch(error => console.error("Error:", error))
})
