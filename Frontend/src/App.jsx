import { useState } from 'react';
import './App.css';

function App() {
  const [emailContent, setEmailContent] = useState('');
  const [tone, setTone] = useState('');
  const [generatedReply, setGeneratedReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch("http://localhost:8080/api/email/generate",{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailContent, tone })
      });

      const data = await response.text();
      setGeneratedReply(data);
    } catch (error) {
      setError('Failed to generate email reply. Please try again.');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Email Reply Generator</h1>

      <textarea 
        placeholder="Enter the original email content here..."
        value={emailContent}
        onChange={(e) => setEmailContent(e.target.value)}
      />

      <select value={tone} onChange={(e) => setTone(e.target.value)}>
        <option value="">Select Tone (Optional)</option>
        <option value="professional">Professional</option>
        <option value="casual">Casual</option>
        <option value="friendly">Friendly</option>
      </select>

      <button onClick={handleSubmit} disabled={!emailContent || loading}>
        {loading ? <div className="loader"></div> : "Generate Reply"}
      </button>

      {error && <p className="error">{error}</p>}

      {generatedReply && (
        <div className="output">
          <h3>Generated Reply:</h3>
          <textarea readOnly value={generatedReply} />
          <button className="copy-btn" onClick={() => navigator.clipboard.writeText(generatedReply)}>Copy to Clipboard</button>
        </div>
      )}
    </div>
  );
}

export default App;