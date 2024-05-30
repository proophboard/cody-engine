
interface TextQuestionProps {
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>, id: number) => void;
  question: { id: number; text: string; options?: string[]};
}

const TextQuestion: React.FC<TextQuestionProps> = ({ handleInputChange, question }) => {
  return (
    <textarea id={"textarea"} placeholder="Hier reinschreiben..."  style={
      {
        width: '100%',
        height: '100px',
        borderRadius: '15px',
        border: '0px',
        backgroundColor: 'rgb(252,206,137)',
        padding: '15px',
        fontSize: '1.2rem',
        fontWeight: 'lighter',
        textAlign: 'start',
        resize: 'none'
      }
    } onChange={(e) => handleInputChange(e, question.id)}></textarea>
  );
};

export default TextQuestion;
