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
                    const thumbnail = offer.image.split(",")[0];  // Use the first image for the thumbnail

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

        // Create the image gallery
        const images = offer.image.split(",").map((imgSrc) => {
            return `<img src="${imgSrc}" alt="Offer Image">`;
        }).join("");

        // Modal content: Gallery + Details
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <div class="modal-images">
                    ${images}
                </div>
                <div class="modal-details">
                    <h2>${offer.title}</h2>
                    <p>${offer.description}</p>
                    <p class="user-info">Posted by: ${offer.user}</p>
                </div>
            </div>
        `;

        // Add the modal to the body
        document.body.appendChild(modal);

        // Close the modal when the close button is clicked
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