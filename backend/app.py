from flask import Flask, jsonify, request
from flask_cors import CORS
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq()

app = Flask(__name__)
CORS(app)

@app.route('/api/hello')
def hello():
    return jsonify({ 'message': 'Hello from Flask backend!' })

@app.route('/api/highlight')
def highlight():
    content = request.args.get('content', '').replace("%20"," ")
    highlights_str = request.args.get('highlights', '[]')
    responses=[]
    try:
        highlights_parsed = json.loads(highlights_str)
        for highlight in highlights_parsed:
            print(highlight['description'])
            h=highlight['description']
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                {
                    "role": "system",
                    "content": f"In the given document, your job is to return the exact words- without any change in punctuation/capitalization as a JSON list which match the highlight phrase provided by the user."
                },
                {
                    "role": "user",
                    "content": f"Document: Sam was born on 11-05-2005\nhis friend Shiva was born on 14-05-2005\n his brother Aniketh was born on 14-09-2011. Words to highlight: Dates, return a JSON list of the matching words"
                },
                {
                    "role": "assistant",
                    "content": '{"highlighted_words": ["11-05-2005", "14-05-2005","14-09-2011"]}'
                },
                {
                    "role": "user",
                    "content": f"Document: Sam Renail was born on 11-05-2005\nhis friend Shiva Rathod was born on 14-05-2005\n his brother Aniketh Vyas was born on 14-09-2011. Words to highlight: Names , return a JSON list of the matching words"
                },
                {
                    "role": "assistant",
                    "content": '{"highlighted_words": ["Sam Renail", "Shiva Rathod","Aniketh Vyas"]}'
                },
                {
                    "role": "user",
                    "content": f"Document:{content},Words to highlight:{h}, return a JSON list of the matching words or sentences, depending on the type."
                }
                ],
                temperature=1,
                max_completion_tokens=1024,
                top_p=1,
                stream=False,
                response_format={"type": "json_object"},
                stop=None
            )
            responses.append(next(iter(json.loads(completion.choices[0].message.content).values())))
    except json.JSONDecodeError:
        highlights_parsed = []
    print(responses)
    return jsonify({
        'content': responses,
        'message': 'Highlights parsed successfully'
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)
