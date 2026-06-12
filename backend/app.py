from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq
import os, json

load_dotenv()

app = Flask(__name__)
CORS(app)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


@app.route("/")
def home():
    return jsonify({"message": "Hello HashMatch!"})


@app.route("/generate-hashtags", methods=["POST"])
def generate_hashtags():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No JSON body sent"}), 400

    post_text = data.get("post_text", "").strip()
    platform  = data.get("platform", "Instagram")
    count     = data.get("count", 10)

    if not post_text:
        return jsonify({"error": "post_text is required"}), 400
    if len(post_text) > 2000:
        return jsonify({"error": "post_text is too long (max 2000 chars)"}), 400

    prompt = f"""You are a social media expert.
Given this {platform} post: "{post_text}"
Generate exactly {count} relevant, trending hashtags.
Return ONLY a JSON array of hashtags like: ["#example", "#hashtag"]
No explanation, no markdown, no extra text. Just the raw JSON array."""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )
        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        hashtags = json.loads(raw)
        return jsonify({"hashtags": hashtags, "platform": platform, "count": len(hashtags)})

    except json.JSONDecodeError:
        return jsonify({"error": "AI returned invalid format", "raw": raw}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/validate-hashtags", methods=["POST"])
def validate_hashtags():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No JSON body sent"}), 400

    post_text = data.get("post_text", "").strip()
    hashtags  = data.get("hashtags", [])

    if not post_text:
        return jsonify({"error": "post_text is required"}), 400
    if not hashtags:
        return jsonify({"error": "hashtags array is required"}), 400

    prompt = f"""You are a social media expert.
Post content: "{post_text}"
Hashtags used: {hashtags}
Rate how relevant these hashtags are to the post on a scale of 1-10.
Return ONLY a JSON object like: {{"score": 8, "feedback": "Most hashtags are relevant but..."}}
No explanation, no markdown, no extra text. Just the raw JSON object."""

    try:
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        result = json.loads(raw)
        return jsonify(result)

    except json.JSONDecodeError:
        return jsonify({"error": "AI returned invalid format", "raw": raw}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)