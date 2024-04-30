document.getElementById('chat-form').addEventListener('submit', async (event) => {
    event.preventDefault();
  
    const userInput = document.getElementById('user-input').value;
    const response = await fetch('http://localhost:3000/converse', {
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