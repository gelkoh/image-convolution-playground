import base64
import sys
from io import BytesIO
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
    return render_template("index.html", predefined_kernels=PREDEFINED_KERNELS)

# Process convolution when sending a POST request
@app.post("/")
def process():
    # Get default image
    img = Image.open("./static/default-img.jpg")
    img_mode = img.mode
    img_pixels = np.asarray(img)

    # Convert to signed integer
    img_pixels = img_pixels.astype(np.int32)

    # Get selected kernel
    selected_kernel_name = request.get_json().get("kernel")
    selected_kernel = PREDEFINED_KERNELS[selected_kernel_name]

    # Flip the kernel
    selected_kernel = np.flip(selected_kernel)

    # Apply kernel
    convolved_img_pixels = scipy.ndimage.convolve(
        img_pixels, 
        selected_kernel[:, :, np.newaxis], 
        mode="nearest"
    )

    # If selected kernel is the edge detection kernel shift all values by 128
    if selected_kernel_name == "EDGE_DETECTION":
        convolved_img_pixels = convolved_img_pixels + 128

    # Clip values beteween 0 and 255 to prevent artifacts
    convolved_img_pixels = np.clip(convolved_img_pixels, 0, 255).astype(np.uint8)

    # Create a new image
    new_img = Image.fromarray(convolved_img_pixels, img_mode)

    # Encode image to a data url
    buffered = BytesIO()
    new_img.save(buffered, format="JPEG")
    updated_img_data = base64.b64encode(buffered.getvalue()).decode("utf-8")

    # Return updated image data to render filtered image
    return jsonify(img_data=updated_img_data)
