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
                    div.innerHTML = `<h3>${offer.title}</h3>
                                     <p>${offer.description}</p>
                                     <img src="${offer.image}" width="100">
                                     <p>Posted by: ${offer.user}</p>`;
                    offersDiv.appendChild(div);
                });
            });
    }

    offerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("title", document.getElementById("title").value);
        formData.append("description", document.getElementById("description").value);
        formData.append("image", document.getElementById("image").files[0]);
        formData.append("user", document.getElementById("user").value);

        fetch("/api/offers", {
            method: "POST",
            body: formData,
        }).then(() => {
            offerForm.reset();
            fetchOffers();
        });
    });

    fetchOffers();
});
