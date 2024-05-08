import React, { ChangeEvent, useState } from 'react';

interface Question {
  id: number;
  text: string;
  options?: string[];
  colorPicker?: boolean;
  // checkbox?: boolean
}

const Questionnaire: React.FC = () => {

  // Edit/Add Questions and options here
  const questions: Question[] = [
    { id: 1, text: 'Which product do you want to sell?' },
    { id: 2, text: 'Which Font should the text have?' },
    { id: 3, text: 'Pick a homepage style!', options: ['Big Areas', 'Much Information', 'Big Pictures'] },
    { id: 4, text: 'Pick a color scheme!', colorPicker: true },
  ];

  // Set default response if no value was given by the user
  const defaultResponses = questions.reduce((acc, question) => {
    acc[question.id] = {
      question: question.text,
      answer: question.options ? question.options[0] : question.colorPicker ? "#000000" : "",
    };
    return acc;
  }, {} as Record<any, any>);

  // Handle State (answers)
  const [responses, setResponses] = useState<Record<any, any>>(defaultResponses);

  // Update State when <input> is changed
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>, id: number) => {
    setResponses({
      ...responses,
      [id]: {
        question: questions.find(question => question.id === id)?.text,
        answer: e.target.value
      }
    });
  };

  const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    console.log(responses);
    fetch('http://localhost:3000/generate-with-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({message: responses }),
    }) //brauchen wir den part ab hier überhaupt? wir werden ja hier nichts machen mit der response. (Die response ist eh leer.)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Success:', data);
        // Do something with the response if needed
      })
      .catch(error => {
        console.error('Error:', error);
      });
  };

  // UI
  return (
    <div style={{ margin: '0 auto', width: '50%', textAlign: 'center' }}>
      {questions.map((question) => (
        <div key={question.id} style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold' }}>{question.text}</label>
          {question.options ? (
            <select style={
              {
                width: '100%',
                height: '30px'
              }
            } onChange={(e) => handleInputChange(e, question.id)}>
              {question.options.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : question.colorPicker ? (
            <input type="color" style={
              {
                width: '100%',
                height: '30px'
              }
            } onChange={(e) => handleInputChange(e, question.id)} />
          ) : (
            <input type="text" style={
              {
                width: '100%',
                height: '30px'
              }
            } onChange={(e) => handleInputChange(e, question.id)} />
          )}
        </div>
      ))}

      <button style={
        {
          padding: '10px 20px',
          backgroundColor: '#007BFF',
          color: 'white', border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }
      } onClick={(e) => handleSubmit(e)}>Submit</button>
    </div>
  );
};

export default Questionnaire;
