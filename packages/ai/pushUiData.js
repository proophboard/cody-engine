//Hier werden die Daten an die Stelle in den Ordnern gemacht, an denen Sie die UI verändern.

//Diese Datei sollte Deterministisch sein. Also wenn man die selbe "Data" übergibt soll auch das selbe visuelle verändert werden!!!.
//Data: Die daten die im Frontend eingebaut werden sollen.
export function pushUIData(Data){

    
}

//Diese Methode ist nur dafür da die Funktionalität zu testen. Sie bringt die Daten zum "Test" Frontend. Eigentlich soll man die Obere benutzen.
export async function pushUIDataTestAI(data){
    await fetch('http://localhost:6010/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: data }),
    }); 
}