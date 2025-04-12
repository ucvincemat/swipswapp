let currentUserId = null; // Store the logged-in user's ID
let isAdmin = false; // Store whether the user is an admin

// Fetch the current user's session
fetch("/api/session")
    .then((res) => res.json())
    .then((data) => {
        if (data.loggedIn) {
            currentUserId = data.username; // Use the username as the identifier
            isAdmin = data.isAdmin; // Check if the user is an admin
        }
    });

document.addEventListener("DOMContentLoaded", () => {
    const offerForm = document.getElementById("offerForm");
    const offersDiv = document.getElementById("offers");

    function getKarmaColor(karma) {
        if (karma >= 3000) return "rgb(3, 192, 255)"; // Max positive karma
        if (karma <= -3000) return "darkred"; // Max negative karma

        function interpolateColor(start, end, factor) {
            // Apply an easing function to the factor for smoother transitions
            const easedFactor = factor * factor * (3 - 2 * factor); // Smoothstep easing
        
            const startRGB = start.match(/\d+/g).map(Number);
            const endRGB = end.match(/\d+/g).map(Number);
            const resultRGB = startRGB.map((startVal, i) =>
                Math.round(startVal + (endRGB[i] - startVal) * easedFactor)
            );
            return `rgb(${resultRGB.join(",")})`;
        }

        if (karma >= 1000) {
            // Green to Light Blue
            const factor = (karma - 1000) / 2000; // Normalize between 1000 and 3000
            return interpolateColor("rgb(0,175,0)", "rgb(0, 167, 223)", factor); // Green to Light Blue
        } else if (karma >= 0) {
            // Orange to Green
            const factor = karma / 1000; // Normalize between 0 and 1000
            return interpolateColor("rgb(255,165,0)", "rgb(0,175,0)", factor); // Orange to Green
        } else if (karma >= -1000) {
            // Orange to Red
            const factor = -karma / 1000; // Normalize between 0 and -1000
            return interpolateColor("rgb(255,165,0)", "rgb(255,0,0)", factor); // Orange to Red
        } else {
            // Red to Dark Red
            const factor = (-karma - 1000) / 2000; // Normalize between -1000 and -3000
            return interpolateColor("rgb(255,0,0)", "hsl(0, 80.00%, 13.70%)", factor); // Red to Dark Red
        }
    }

    function fetchOffers() {
        fetch("/api/offers")
            .then((res) => res.json())
            .then((offers) => {
                offersDiv.innerHTML = "";
                offers.forEach((offer) => {
                    const div = document.createElement("div");
                    div.classList.add("offer");

                    // Only display the first image as the thumbnail
                    const thumbnail = offer.image.split(",")[0];

                    // Determine karma color using the gradient function
                    const karmaColor = getKarmaColor(offer.karma);

                    div.innerHTML = `
                        <h3>${offer.title}</h3>
                        <img src="${thumbnail}" width="100" class="thumbnail" data-id="${offer.id}">
                        <div class="poster-info">
                            ${offer.user}<br><span style="color: ${karmaColor}">${offer.karma} Karma</span>
                        </div>
                    `;

                    // Attach the click event listener to the entire card
                    div.addEventListener("click", () => {
                        openModal(offer);
                    });

                    offersDiv.appendChild(div);
                });
            });
    }

    // Function to open the modal and display all images
    function openModal(offer) {
        const modal = document.createElement("div");
        modal.classList.add("modal");

        // Determine karma color using the gradient function
        const karmaColor = getKarmaColor(offer.karma);

        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <div class="modal-images">
                    ${offer.image.split(",").map((imgSrc) => `<img src="${imgSrc}" alt="Offer Image">`).join("")}
                </div>
                <div class="modal-details">
                    <h2>${offer.title}</h2>
                    <p class="user-info">
                        Posted by: ${offer.user} 
                        <span style="color: ${karmaColor}; font-weight: bold;">(${offer.karma})</span>
                    </p>
                    <p>${offer.description}</p>
                    ${(offer.isOwner || isAdmin) ? `<button id="deleteOffer">Delete Offer</button>` : ""}
                </div>
                <div class="modal-footer">
                    <button class="swap-button">
                        <span class="icon-loop"></span> Swap
                    </button>
                    <button class="report-button">
                        <span class="icon-warning"></span> Report
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Apply zoom effect to modal images
        applyZoomEffectToModalImages();

        if (offer.isOwner || isAdmin) {
            document.getElementById("deleteOffer").addEventListener("click", () => {
                fetch(`/api/offers/${offer.id}`, { method: "DELETE" }).then(() => {
                    document.body.removeChild(modal);
                    fetchOffers();
                });
            });
        }

        modal.querySelector(".close").addEventListener("click", () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    function enableImageZoom(imageElement) {
        const zoomPreview = document.createElement("div");
        zoomPreview.classList.add("zoom-preview");
        imageElement.parentElement.appendChild(zoomPreview);

        imageElement.addEventListener("mousemove", (e) => {
            const rect = imageElement.getBoundingClientRect();
            const x = e.clientX - rect.left; // X position within the image
            const y = e.clientY - rect.top; // Y position within the image

            const xPercent = (x / rect.width) * 100; // X percentage
            const yPercent = (y / rect.height) * 100; // Y percentage

            zoomPreview.style.display = "block";
            zoomPreview.style.backgroundImage = `url(${imageElement.src})`;
            zoomPreview.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
            zoomPreview.style.top = `${e.clientY - rect.top - 75}px`; // Center the preview vertically
            zoomPreview.style.left = `${e.clientX - rect.left + 50}px`; // Offset the preview further to the right
        });

        imageElement.addEventListener("mouseleave", () => {
            zoomPreview.style.display = "none";
        });
    }

    // Apply the zoom effect to all images in the modal
    function applyZoomEffectToModalImages() {
        const modalImages = document.querySelectorAll(".modal-images img");
        modalImages.forEach((image) => enableImageZoom(image));
    }

    fetchOffers();
});