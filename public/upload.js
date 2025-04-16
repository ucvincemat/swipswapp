const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("image");
const imagePreview = document.getElementById("imagePreview");

dropArea.addEventListener("click", () => fileInput.click());

dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.classList.add("active");
});

dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("active");
});

dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    dropArea.classList.remove("active");
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener("change", () => handleFiles(fileInput.files));

function handleFiles(files) {
    imagePreview.innerHTML = "";
    const dataTransfer = new DataTransfer(); // Create a DataTransfer object to update fileInput

    [...files].forEach((file) => {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.classList.add("preview-img");
        imagePreview.appendChild(img);

        // Add the file to the DataTransfer object
        dataTransfer.items.add(file);
    });

    // Update the fileInput element with the new files
    fileInput.files = dataTransfer.files;
}

document.getElementById("offerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", document.getElementById("title").value);
    formData.append("description", document.getElementById("description").value);
    [...fileInput.files].forEach((file) => {
        formData.append("images", file);
    });

    fetch("/api/offers", {
        method: "POST",
        body: formData,
    }).then((res) => {
        if (res.ok) {
            window.location.href = "index.html";
        } else {
            res.json().then((data) => {
                alert(data.error || "Failed to create offer. Please try again.");
            });
        }
    });
});