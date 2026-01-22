const output = document.getElementById("output");

function log(title, value) {
  output.textContent += `\n=== ${title} ===\n`;
  output.textContent +=
    typeof value === "string"
      ? value
      : JSON.stringify(value, null, 2);
  output.textContent += "\n";
}

document.getElementById("fetchBtn").onclick = async () => {
  try {
    const r = await fetch(
      "https://vibe-cody.ai/api-mock/messages/csp-test",
      { headers: { "CE-User": "csp-user" } }
    );
    log("fetch()", await r.json());
  } catch (e) {
    log("fetch() error", String(e));
  }
};

document.getElementById("xhrBtn").onclick = () => {
  const xhr = new XMLHttpRequest();
  xhr.open(
    "POST",
    "https://vibe-cody.ai/api-mock/messages/csp-xhr"
  );
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("CE-User", "csp-user");
  xhr.onload = () => log("XHR", xhr.responseText);
  xhr.onerror = () => log("XHR error", "failed");
  xhr.send(JSON.stringify({ hello: "world" }));
};
