const form = document.getElementById("startForm");
const input = document.getElementById("startInput");

// Automatically focus the input when the page loads
window.onload = () => {
    input.focus();
};

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const message = input.value.trim();

    if (message === "") return;

    // Save the first message for the chat page
    sessionStorage.setItem("firstMessage", message);

    // Go to the chat page
    window.location.href = "chat.html";
});