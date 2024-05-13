
interface OptionsProps {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>, id: number) => void;
  question: { id: number; text: string; options?: string[]};
}

const OptionsQuestion: React.FC<OptionsProps> = ({ handleInputChange, question }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
      {question.options?.map((option, index) => (
        <label key={index} style={
          {
            display: 'block',
            fontSize: '1.2rem',
            fontWeight: 'lighter',
            cursor: 'pointer',
          }
        }>
          <input
            type="radio"
            name={`question-${question.id}`}
            value={option}
            onChange={(e) => handleInputChange(e, question.id)}
            defaultChecked={index === 0}
            style={{
              cursor: 'pointer',
              marginRight: '20px',
            }}
          />
          {option}
        </label>
      ))}
    </div>
  );
};

export default OptionsQuestion;
