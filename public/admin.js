fetch("/api/session")
    .then((res) => res.json())
    .then((data) => {
        if (!data.loggedIn || !data.isAdmin) {
            window.location.href = "index.html";
        }
    });

function fetchUsers() {
    fetch("/api/users")
        .then((res) => {
            if (!res.ok) {
                throw new Error(`Failed to fetch users: ${res.status} ${res.statusText}`);
            }
            return res.json();
        })
        .then((users) => {
            const tableBody = document.querySelector("#usersTable tbody");
            tableBody.innerHTML = "";

            users.forEach((user) => {
                const row = document.createElement("tr");
                row.setAttribute("data-id", user.id);

                row.innerHTML = `
                    <td>${user.username}</td>
                    <td class="karma-value" style="color: ${getKarmaColor(user.karma)}">${user.karma}</td>
                    <td>
                        <button class="increase" data-id="${user.id}">+100 Karma</button>
                        <button class="decrease" data-id="${user.id}">-100 Karma</button>
                        <button class="ban" data-id="${user.id}">Ban</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            document.querySelectorAll(".increase").forEach((button) => {
                button.addEventListener("click", () => updateKarma(button.dataset.id, 100));
            });

            document.querySelectorAll(".decrease").forEach((button) => {
                button.addEventListener("click", () => updateKarma(button.dataset.id, -100));
            });

            document.querySelectorAll(".ban").forEach((button) => {
                button.addEventListener("click", () => {
                    if (confirm("Are you sure you want to ban this user?")) {
                        banUser(button.dataset.id);
                    }
                });
            });
        })
        .catch((error) => {
            console.error(error);
            alert("Failed to load users. Please try again later.");
        });
}

function updateKarma(userId, amount) {
    fetch(`/api/users/${userId}/karma`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
    })
        .then(() => fetch("/api/users"))
        .then((res) => res.json())
        .then((users) => {
            const user = users.find((u) => u.id == userId);
            const row = document.querySelector(`[data-id="${userId}"]`).closest("tr");
            const karmaCell = row.querySelector(".karma-value");

            karmaCell.textContent = user.karma;
            karmaCell.style.color = getKarmaColor(user.karma);

            karmaCell.classList.add("pop-animation");
            setTimeout(() => karmaCell.classList.remove("pop-animation"), 300);
        })
        .catch((error) => {
            console.error("Failed to update karma:", error);
        });
}

function banUser(userId) {
    fetch(`/api/users/${userId}`, { method: "DELETE" }).then(() => fetchUsers());
}

function getKarmaColor(karma) {
    if (karma >= 3000) return "rgb(3, 192, 255)";
    if (karma <= -3000) return "darkred";

    const interpolateColor = (start, end, factor) => {
        const easedFactor = factor * factor * (3 - 2 * factor);

        const startRGB = start.match(/\d+/g).map(Number);
        const endRGB = end.match(/\d+/g).map(Number);
        const resultRGB = startRGB.map((startVal, i) =>
            Math.round(startVal + (endRGB[i] - startVal) * easedFactor)
        );
        return `rgb(${resultRGB.join(",")})`;
    };

    if (karma >= 1000) {
        const factor = (karma - 1000) / 2000;
        return interpolateColor("rgb(0,175,0)", "rgb(3,197,250)", factor); // Green to Light Blue
    } else if (karma >= 0) {
        const factor = karma / 1000;
        return interpolateColor("rgb(255,165,0)", "rgb(0,175,0)", factor); // Orange to Green
    } else if (karma >= -1000) {
        const factor = -karma / 1000;
        return interpolateColor("rgb(255,165,0)", "rgb(255,0,0)", factor); // Orange to Red
    } else {
        const factor = (-karma - 1000) / 2000;
        return interpolateColor("rgb(255,0,0)", "rgb(63,7,7)", factor); // Red to Dark Red
    }
}

fetchUsers();