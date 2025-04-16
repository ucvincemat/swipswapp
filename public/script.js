let currentUserId = null;
let isAdmin = false;

fetch("/api/session")
    .then((res) => res.json())
    .then((data) => {
        if (data.loggedIn) {
            currentUserId = data.username;
            isAdmin = data.isAdmin;
        }
    });

document.addEventListener("DOMContentLoaded", () => {
    const offerForm = document.getElementById("offerForm");
    const offersDiv = document.getElementById("offers");

    function getKarmaColor(karma) {
        if (karma >= 3000) return "rgb(3, 192, 255)";
        if (karma <= -3000) return "darkred";

        function interpolateColor(start, end, factor) {
            const easedFactor = factor * factor * (3 - 2 * factor);
        
            const startRGB = start.match(/\d+/g).map(Number);
            const endRGB = end.match(/\d+/g).map(Number);
            const resultRGB = startRGB.map((startVal, i) =>
                Math.round(startVal + (endRGB[i] - startVal) * easedFactor)
            );
            return `rgb(${resultRGB.join(",")})`;
        }

        if (karma >= 1000) {
            const factor = (karma - 1000) / 2000;
            return interpolateColor("rgb(0,175,0)", "rgb(0, 167, 223)", factor); // Green to Light Blue
        } else if (karma >= 0) {
            const factor = karma / 1000;
            return interpolateColor("rgb(255,165,0)", "rgb(0,175,0)", factor); // Orange to Green
        } else if (karma >= -1000) {
            const factor = -karma / 1000;
            return interpolateColor("rgb(255,165,0)", "rgb(255,0,0)", factor); // Orange to Red
        } else {
            const factor = (-karma - 1000) / 2000; 
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

        
                    const thumbnail = offer.image.split(",")[0];

                    const karmaColor = getKarmaColor(offer.karma);

                    div.innerHTML = `
                        <h3>${offer.title}</h3>
                        <img src="${thumbnail}" width="100" class="thumbnail" data-id="${offer.id}">
                        <div class="poster-info">
                            ${offer.user}<br><span style="color: ${karmaColor}">${offer.karma} Karma</span>
                        </div>
                    `;

                    div.addEventListener("click", () => {
                        openModal(offer);
                    });

                    offersDiv.appendChild(div);
                });
            });
    }

    function openModal(offer) {
        const modal = document.createElement("div");
        modal.classList.add("modal");

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
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const xPercent = (x / rect.width) * 100;
            const yPercent = (y / rect.height) * 100;

            zoomPreview.style.display = "block";
            zoomPreview.style.backgroundImage = `url(${imageElement.src})`;
            zoomPreview.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
            zoomPreview.style.top = `${e.clientY - rect.top - 75}px`;
            zoomPreview.style.left = `${e.clientX - rect.left + 50}px`;
        });

        imageElement.addEventListener("mouseleave", () => {
            zoomPreview.style.display = "none";
        });
    }

    function applyZoomEffectToModalImages() {
        const modalImages = document.querySelectorAll(".modal-images img");
        modalImages.forEach((image) => enableImageZoom(image));
    }

    fetchOffers();
});