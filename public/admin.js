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
                row.innerHTML = `
                    <td>${user.username}</td>
                    <td>${user.karma}</td>
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
    }).then(() => fetchUsers());
}

function banUser(userId) {
    fetch(`/api/users/${userId}`, { method: "DELETE" }).then(() => fetchUsers());
}

fetchUsers();