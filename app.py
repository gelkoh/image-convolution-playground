import base64
import sys
from io import BytesIO
import json
from flask import Flask, request, render_template, jsonify, url_for
from PIL import Image
import numpy as np
import scipy

# Initialize Flask
app = Flask(__name__)

# Some predefined filters
# TODO: Figure out best way of adding a factor for scaling kernels
PREDEFINED_KERNELS = {
    "IDENTITY": np.array([
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0]
    ]),
    "EDGE_DETECTION": np.array([
        [-1, -1,  -1],
        [-1,  8,  -1],
        [-1, -1,  -1]
    ]),
    "SHARPEN": np.array([
        [ 0, -1,  0],
        [-1,  5, -1],
        [ 0, -1,  0]
    ]),
    "BOX_BLUR": np.array([
        [1/9, 1/9, 1/9],
        [1/9, 1/9, 1/9],
        [1/9, 1/9, 1/9]
    ])
}

# Initially render the template when visiting the site
@app.route("/")
def run():
    predefined_kernels_names = []

    for kernel_name in PREDEFINED_KERNELS:
        predefined_kernels_names.append(kernel_name)

    predefined_kernels_json = {
        key: kernel.tolist() for key, kernel in PREDEFINED_KERNELS.items()
    }

    predefined_kernels_json = json.dumps(predefined_kernels_json)

    return render_template(
        "index.html",
        predefined_kernels_names=predefined_kernels_names,
        predefined_kernels_json=predefined_kernels_json
    )

# Process convolution when sending a POST request
@app.post("/")
def process():
    img = None

    # Handle whether to use default or uploaded image
    if request.get_json().get("customImg"):
        custom_img_data = request.get_json().get("customImg")

        # Retrieve base64 string from image url
        base64_data = custom_img_data.split(",")[1]

        # Decode the base64 data
        image_data = base64.b64decode(base64_data)

        # Load the image data into Pillow for further processing
        img = Image.open(BytesIO(image_data))
    else:
        img = Image.open("./static/default-img.jpg")

    # If image should be converted to grayscale before processing
    apply_grayscale = request.get_json().get("applyGrayscale")

    if apply_grayscale:
        img = img.convert("L")

    img_pixels = np.asarray(img)

    # Convert to signed integer
    img_pixels = img_pixels.astype(np.int32)

    # Get selected kernel
    selected_kernel_name = request.get_json().get("selectedKernelName")

    selected_kernel = None

    # If custom kernel was created
    if selected_kernel_name == "CUSTOM":
        selected_kernel = request.get_json().get("customKernelValues")
    else:
        selected_kernel = PREDEFINED_KERNELS[selected_kernel_name]

    # Flip the kernel
    selected_kernel = np.flip(selected_kernel)

    # Get selected edge handling mode
    selected_edge_handling_mode = request.get_json().get("selectedEdgeHandlingMode")

    convolved_img_pixels = np.array([], dtype=np.int8)

    # Apply kernel
    if not apply_grayscale:
        selected_kernel = selected_kernel[:, :, np.newaxis]

    convolved_img_pixels = scipy.ndimage.convolve(
        img_pixels,
        selected_kernel,
        mode=selected_edge_handling_mode
    )

    # If selected kernel is the edge detection kernel shift all values by 128
    if selected_kernel_name == "EDGE_DETECTION":
        convolved_img_pixels = convolved_img_pixels + 128

    # Clip values beteween 0 and 255 to prevent artifacts
    convolved_img_pixels = np.clip(convolved_img_pixels, 0, 255).astype(np.uint8)

    # Create a new image
    new_img = Image.fromarray(convolved_img_pixels)

    # Encode image to a data url
    buffered = BytesIO()
    new_img.save(buffered, format="JPEG")
    updated_img_data = base64.b64encode(buffered.getvalue()).decode("utf-8")

    # Return updated image data to render filtered image
    return jsonify(img_data=updated_img_data)
