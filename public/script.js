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

        // Check if the current user is the owner of the offer or an admin
        const isOwner = currentUserId && offer.user === currentUserId;

        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <div class="modal-images">
                    ${offer.image.split(",").map((imgSrc) => `<img src="${imgSrc}" alt="Offer Image">`).join("")}
                </div>
                <div class="modal-details">
                    <h2>${offer.title}</h2>
                    <p>${offer.description}</p>
                    <p class="user-info">Posted by: ${offer.user}</p>
                    ${(isOwner || isAdmin) ? `<button id="deleteOffer">Delete Offer</button>` : ""}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listener for the delete button if the user is the owner or an admin
        if (isOwner || isAdmin) {
            document.getElementById("deleteOffer").addEventListener("click", () => {
                fetch(`/api/offers/${offer.id}`, { method: "DELETE" }).then(() => {
                    document.body.removeChild(modal);
                    fetchOffers();
                });
            });
        }

        // Add event listener to close the modal
        modal.querySelector(".close").addEventListener("click", () => {
            document.body.removeChild(modal);
        });

        // Close the modal if clicked outside of the modal content
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    fetchOffers();
});