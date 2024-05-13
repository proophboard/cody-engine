function generateAIPrompt(preferences) {
    return JSON.stringify({
        messages: [
            { role: 'system', content: 'Generate a Material-UI theme configuration based on user input.' },
            { role: 'user', content: preferences } 
        ],
        model: 'llama3',
    });
}
export default generateAIPrompt;