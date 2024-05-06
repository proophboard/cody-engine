//Hier werden die Daten an die Stelle in den Ordnern gemacht, an denen Sie die UI verändern.


export function pushUIData(Data){

    
}

//Diese Methode ist nur dafür da die Funktionalität zu testen. Eigentlich soll man die Obere benutzen.
export async function pushUIDataTestAI(data){
    await fetch('http://localhost:6010/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: data }),
    }); 
}