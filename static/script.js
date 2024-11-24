// Convert JSON string to object
const predefinedKernelsObj = JSON.parse(predefinedKernels)

// Select DOM elements
const convolutionSettingsForm = document.getElementById("convolutionSettingsForm")
const kernelSelect = document.getElementById("kernelSelect")
const edgeHandlingModeSelect = document.getElementById("edgeHandlingModeSelect")
const kernelDisplay = document.getElementById("kernelDisplay")
const rowCountInput = document.getElementById("rowCountInput")
const colCountInput = document.getElementById("colCountInput")
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

const applyInputEventListeners = () => {
    const weightInputs = kernelDisplay.querySelectorAll("input")

    for (let i = 0; i < weightInputs.length; i++) {
        weightInputs[i].addEventListener("change", () => {
            kernelSelect.value = "CUSTOM"
        })
    }
}

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
            weightInput.setAttribute("step", "any")

            weightInput.value = selectedKernelWeights[row][col]

            tableCell.appendChild(weightInput)
            tableRow.appendChild(tableCell) 
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
    if (kernelSelect.value !== "CUSTOM") {
        rowCountInput.value = "3"
        colCountInput.value = "3"
    }

    updateKernelDisplay()
    applyInputEventListeners()
})

// Handle changing row count
let rowCountOld = rowCountInput.value

rowCountInput.addEventListener("change", () => {
    // As soon as the dimensions change, kernel is a custom kernel
    kernelSelect.value = "CUSTOM"

    let rowCountNew = rowCountInput.value
    const colCount = colCountInput.value
    
    if (rowCountNew < 1) {
        rowCountNew = 1
        rowCountInput.value = rowCountNew
    }

    const differenceInCount = rowCountNew - rowCountOld

    if (differenceInCount > 0) {
        for (let i = 0; i < differenceInCount; i++) {
            const newRow = document.createElement("tr")

            for (let j = 0; j < colCount; j++) {
                const newTableCell = document.createElement("td")
                const newWeightInput = document.createElement("input")

                newWeightInput.setAttribute("type", "number")
                newWeightInput.setAttribute("step", "any")
                newWeightInput.setAttribute("value", "0")

                newTableCell.appendChild(newWeightInput)
                newRow.appendChild(newTableCell)
            }

            kernelDisplay.appendChild(newRow)
        }
    } else {
        const selector = "tr:nth-last-child(-n+" + Math.abs(differenceInCount) + ")"
        const lastRows = kernelDisplay.querySelectorAll(selector)

        lastRows.forEach(row => {
            row.remove()
        })
    }

    rowCountOld = rowCountNew
    applyInputEventListeners()
})

// Handle changing column count
let colCountOld = colCountInput.value

colCountInput.addEventListener("change", () => {
    // As soon as the dimensions change, kernel is a custom kernel
    kernelSelect.value = "CUSTOM"

    let colCountNew = colCountInput.value
    const rowCount = rowCountInput.value
    
    if (colCountNew < 1) {
        colCountNew = 1
        colCountInput.value = colCountNew
    }

    const differenceInCount = colCountNew - colCountOld

    const rows = kernelDisplay.querySelectorAll("tr")

    if (differenceInCount > 0) {
        for (let i = 0; i < rowCount; i++) {
            for (let j = 0; j < differenceInCount; j++) {
                const newTableCell = document.createElement("td")
                const newWeightInput = document.createElement("input")

                newWeightInput.setAttribute("type", "number")
                newWeightInput.setAttribute("step", "any")
                newWeightInput.setAttribute("value", "0")

                newTableCell.appendChild(newWeightInput)

                rows[i].appendChild(newTableCell)
            }
        }
    } else {
        const selector = "td:nth-last-child(-n+" + Math.abs(differenceInCount) + ")"
        const lastTableCells = kernelDisplay.querySelectorAll(selector)

        lastTableCells.forEach(tableCell => {
            tableCell.remove()
        })
    }

    colCountOld = colCountNew
    applyInputEventListeners()
})

convolutionSettingsForm.addEventListener("submit", async (event) => {
    // Prevent default action
    event.preventDefault()

    const formData = new FormData(convolutionSettingsForm)
    const selectedKernelName = formData.get("kernel")
    const selectedEdgeHandlingMode = formData.get("edgeHandlingMode")
    const applyGrayscale = formData.get("applyGrayscale")

    // Create a JSON object
    const requestData = {
        selectedKernelName: selectedKernelName,
        selectedEdgeHandlingMode: selectedEdgeHandlingMode,
        applyGrayscale: applyGrayscale,
        applyGrayscale: applyGrayscale === "on" ? true : false
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
