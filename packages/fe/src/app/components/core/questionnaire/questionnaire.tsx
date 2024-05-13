import React, { ChangeEvent, useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../../../providers/ToggleColorMode';

interface Question {
  id: number;
  text: string;
  options?: string[];
  colorPicker?: boolean;
  // checkbox?: boolean
}

const Questionnaire: React.FC = () => {

  const { applyTheme } = useContext(ThemeContext);

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
    fetch('http://localhost:3000/api/generate-with-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({message: responses }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        } else
          fetchThemeConfig();
      })
  };


  const fetchThemeConfig = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/theme-config');
      const themeConfig = await response.json();


      const mockThemeConfig = {
        "palette": {
          "primary": {
            "main": "#123456",
            "light": "#CFD8DC",
            "dark": "#455A64",
            "contrastText": "#FFFFFF"
          },
          "secondary": {
            "main": "#FF5722",
            "light": "#FFCCBC",
            "dark": "#E64A19",
            "contrastText": "#000000"
          },
          "error": {
            "main": "#F44336",
            "light": "#FFCDD2",
            "dark": "#D32F2F",
            "contrastText": "#FFFFFF"
          },
          "warning": {
            "main": "#FFC107",
            "light": "#FFECB3",
            "dark": "#FFA000",
            "contrastText": "#212121"
          },
          "info": {
            "main": "#03A9F4",
            "light": "#B3E5FC",
            "dark": "#0288D1",
            "contrastText": "#000000"
          },
          "success": {
            "main": "#4CAF50",
            "light": "#C8E6C9",
            "dark": "#388E3C",
            "contrastText": "#FFFFFF"
          },
          "common": {
            "black": "#000000",
            "white": "#FFFFFF"
          }
        },
        "typography": {
          "fontFamily": "\"Roboto\", \"Arial\", sans-serif",
          "fontSize": 14,
          "h1": {
            "fontFamily": "\"Roboto\", \"Arial\", sans-serif",
            "fontWeight": 300,
            "fontSize": "6rem",
            "lineHeight": 1.167,
            "letterSpacing": "-0.01562em"
          }
        },
        "transitions": {
          "easing": {
            "easeInOut": "cubic-bezier(0.4, 0, 0.2, 1)",
            "easeOut": "cubic-bezier(0.0, 0, 0.2, 1)",
            "easeIn": "cubic-bezier(0.4, 0, 1, 1)",
            "sharp": "cubic-bezier(0.4, 0, 0.6, 1)"
          },
          "duration": {
            "shortest": 150,
            "shorter": 200,
            "short": 250,
            "standard": 300,
            "complex": 375,
            "enteringScreen": 225,
            "leavingScreen": 195
          }
        },
        "shape": {
          "borderRadius": 4
        }
      };


      applyTheme(mockThemeConfig);
    } catch (error) {
      console.error('Failed to fetch theme config:', error);
    }
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
