import { useState } from "react";
import "./App.css";

const PLATFORMS = ["Instagram", "Twitter", "LinkedIn"];
const COUNTS = [5, 10, 20];

export default function App() {
  const [postText, setPostText] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [count, setCount] = useState(10);
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const generateHashtags = async () => {
    if (!postText.trim()) {
      setError("Please enter some post content first.");
      return;
    }
    setLoading(true);
    setError("");
    setHashtags([]);

    try {
      const res = await fetch("http://127.0.0.1:5000/generate-hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_text: postText, platform, count }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setHashtags(data.hashtags);
    } catch (err) {
      setError("Something went wrong. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const copyTag = (tag) => {
    navigator.clipboard.writeText(tag);
    setCopied(tag);
    setTimeout(() => setCopied(""), 1500);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(hashtags.join(" "));
    setCopied("all");
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <div className="container">
      <div className="header">
        <h1># HashMatch</h1>
        <p>AI-powered hashtag generator for your social media posts</p>
      </div>

      <div className="card">
        <textarea
          className="textarea"
          placeholder="Paste your post content here..."
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
          rows={5}
        />

        <div className="controls">
          <div className="control-group">
            <label>Platform</label>
            <div className="btn-group">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  className={`pill-btn ${platform === p ? "active" : ""}`}
                  onClick={() => setPlatform(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label>Count</label>
            <div className="btn-group">
              {COUNTS.map((c) => (
                <button
                  key={c}
                  className={`pill-btn ${count === c ? "active" : ""}`}
                  onClick={() => setCount(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          className="generate-btn"
          onClick={generateHashtags}
          disabled={loading}
        >
          {loading ? "Generating..." : "✨ Generate Hashtags"}
        </button>

        {error && <p className="error">{error}</p>}
      </div>

      {hashtags.length > 0 && (
        <div className="card results">
          <div className="results-header">
            <h2>Generated Hashtags</h2>
            <button className="copy-all-btn" onClick={copyAll}>
              {copied === "all" ? "✓ Copied!" : "Copy All"}
            </button>
          </div>
          <div className="hashtag-grid">
            {hashtags.map((tag) => (
              <button
                key={tag}
                className={`hashtag-pill ${copied === tag ? "copied" : ""}`}
                onClick={() => copyTag(tag)}
              >
                {copied === tag ? "✓ Copied!" : tag}
              </button>
            ))}
          </div>
          <p className="hint">Click any hashtag to copy it</p>
        </div>
      )}
    </div>
  );
}