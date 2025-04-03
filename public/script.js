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

                    div.innerHTML = `
                        <h3>${offer.title}</h3>
                        <img src="${thumbnail}" width="100" class="thumbnail" data-id="${offer.id}">
                    `;
                    offersDiv.appendChild(div);

                    // Attach the click event listener dynamically
                    const thumbnailImage = div.querySelector(".thumbnail");
                    thumbnailImage.addEventListener("click", () => {
                        openModal(offer);
                    });
                });
            });
    }

    // Function to open the modal and display all images
    function openModal(offer) {
        const modal = document.createElement("div");
        modal.classList.add("modal");

        // Determine karma color
        const karmaColor = offer.karma > 1000 ? "green" : offer.karma < -1000 ? "red" : "orange";

        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <div class="modal-images">
                    ${offer.image.split(",").map((imgSrc) => `<img src="${imgSrc}" alt="Offer Image">`).join("")}
                </div>
                <div class="modal-details">
                    <h2>${offer.title}</h2>
                    <p>${offer.description}</p>
                    <p class="user-info">
                        Posted by: ${offer.user} 
                        <span style="color: ${karmaColor}; font-weight: bold;">(${offer.karma})</span>
                    </p>
                    ${(offer.isOwner || isAdmin) ? `<button id="deleteOffer">Delete Offer</button>` : ""}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

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

    fetchOffers();
});