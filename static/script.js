// Select the form to select filters
const kernelSelectForm = document.getElementById("kernelSelectForm")
const kernelSelect = document.getElementById("kernelSelect")
const outputImage = document.getElementById("outputImg")

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
