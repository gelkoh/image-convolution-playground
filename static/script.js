// Convert JSON string to object
const predefinedKernelsObj = JSON.parse(predefinedKernels)

// Select DOM elements
const convolutionSettingsForm = document.getElementById("convolutionSettingsForm")
const kernelSelect = document.getElementById("kernelSelect")
const edgeHandlingModeSelect = document.getElementById("edgeHandlingModeSelect")
const kernelDisplay = document.getElementById("kernelDisplay")
const imgInput = document.getElementById("imgInput")
const outputImg = document.getElementById("outputImg")
const resetImgInputBtn = document.getElementById("resetImgInputBtn")
const imgInputBtn = document.getElementById("imgInputBtn")
const downloadImgBtn = document.getElementById("downloadImgBtn") 

const readUploadedImg = () => {
    return new Promise((resolve, reject) => {
        const uploadedImg = imgInput.files[0]
        const reader = new FileReader()

        reader.onloadend = () => resolve(reader.result)
        reader.onerror = (error) => reject(error)

        reader.readAsDataURL(uploadedImg)
    })
}

imgInputBtn.addEventListener("click", () => {
    imgInput.click()
})

imgInput.addEventListener("change", async () => {
    try {
        const imgData = await readUploadedImg()

        inputImg.src = imgData
        outputImg.src = imgData
    } catch(error) {
        console.error("Error reading uploaded image:", error)
    }
})

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

convolutionSettingsForm.addEventListener("submit", async (event) => {
    // Prevent default action
    event.preventDefault()

    const formData = new FormData(convolutionSettingsForm)
    const selectedKernelName = formData.get("kernel")
    const selectedEdgeHandlingMode = formData.get("edgeHandlingMode")

    // Create a JSON object
    const requestData = {
        selectedKernelName: selectedKernelName,
	selectedEdgeHandlingMode: selectedEdgeHandlingMode
    }

    // If custom kernel is selected, get custom kernel values
    if (selectedKernelName === "CUSTOM") {
        requestData.customKernelValues = getKernelValues();
    }

    // If there is an uploaded image append it to the request data
    if (imgInput.files[0]) {
        const uploadedImg = await readUploadedImg()

        requestData.customImg = uploadedImg
    }

    fetch("/", {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
            outputImg.src = "data:image/jpeg;base64," + data.img_data
        })
    .catch(error => console.error("Error:", error))
})

// On download button click create and click temporary download link
downloadImgBtn.addEventListener("click", () => {
    const downloadLink = document.createElement("a")    

    downloadLink.href = outputImg.src
    downloadLink.download = "output"

    document.body.appendChild(downloadLink)

    downloadLink.click()
    downloadLink.remove()
})
