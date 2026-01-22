// popup.js
const statusEl = document.getElementById("status");
const handlersEl = document.getElementById("handlers");

function updateHandlers () {
  try {
    chrome.runtime.sendMessage({ type: "vibe-cody-sw-get-registered-handlers" }, (response) => {
      if (response && response.length > 0) {
        statusEl.textContent = "Handler connected";
        statusEl.classList.remove("disconnected");
        statusEl.classList.add("connected");

        handlersEl.innerHTML = "";
        response.forEach((h) => {
          const li = document.createElement("li");
          li.textContent = h;
          handlersEl.appendChild(li);
        });
      } else {
        statusEl.textContent = "No handler connected";
        statusEl.classList.remove("connected");
        statusEl.classList.add("disconnected");
      }
    });
  } catch (e) {
    console.warn("[VibeCodyExtension] error in popup update: ", e);
  }
}


updateHandlers();
const intervalId = setInterval(updateHandlers, 1000);

// Optional: clear interval on unload
window.addEventListener("unload", () => clearInterval(intervalId));
