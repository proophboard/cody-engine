//die js datei für unsere index.html test frontend


//Diese Methode erzeugt einen Promt direkt aus der eingabe. Das man entspannt debuggen kann und einfach selbst bisschen testen.
document.getElementById('chat-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const userInput = document.getElementById('user-input').value;
    const response = await fetch('http://localhost:3000/test-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userInput }),
    });
  
    if (response.ok) {
      const htmlResponse = await response.text();
      document.getElementById('chat-box').innerHTML = htmlResponse;
    } else {
      console.error('Error:', response.statusText);
    }
  });

  //Zeigt den letzten von Cody generierten Prompt an.
document.getElementById('refresh').addEventListener('submit', async (event) => {
    event.preventDefault();
  
    const response = await fetch('http://localhost:6010/getLastMessage');
    console.log("getLastMessage war: ", response);
    if (response.ok) {
      const htmlResponse = await response.text();
      document.getElementById('chat-box').innerHTML = htmlResponse;
    } else {
      console.error('Error:', response.statusText);
    }
  });