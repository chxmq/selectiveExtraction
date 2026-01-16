from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    print("WARNING: GROQ_API_KEY not found in environment or .env file.")
client = Groq(api_key=api_key) if api_key else None

app = Flask(__name__)
CORS(app)

def chunk_text(text, chunk_size=2000, overlap=200):
    """
    Split text into overlapping chunks
    
    Args:
        text: The text to chunk
        chunk_size: Maximum size of each chunk in characters
        overlap: Number of characters to overlap between chunks
    
    Returns:
        List of text chunks
    """
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        
        # If this is not the last chunk, try to break at a sentence or word boundary
        if end < len(text):
            # Look for sentence boundaries (., !, ?) within the last 100 chars
            sentence_break = max(
                text.rfind('. ', start, end),
                text.rfind('! ', start, end),
                text.rfind('? ', start, end)
            )
            
            if sentence_break > start + chunk_size - 200:  # If we found a good break point
                end = sentence_break + 1
            else:
                # Look for word boundary (space)
                space_break = text.rfind(' ', start, end)
                if space_break > start:
                    end = space_break
        
        chunks.append(text[start:end])
        start = end - overlap  # Move back by overlap amount
        
        # Prevent infinite loop on last chunk
        if start + overlap >= len(text):
            if end < len(text):
                chunks.append(text[end:])
            break
    
    return chunks

def deduplicate_highlights(highlights):
    """
    Remove duplicate highlights from the list
    
    Args:
        highlights: List of highlight strings
    
    Returns:
        Deduplicated list of highlights
    """
    seen = set()
    unique = []
    
    for item in highlights:
        # Normalize whitespace for comparison
        normalized = ' '.join(item.split())
        if normalized.lower() not in seen:
            seen.add(normalized.lower())
            unique.append(item)
    
    return unique

@app.route('/api/hello')
def hello():
    return jsonify({ 'message': 'Hello from Flask backend!' })

@app.route('/api/highlight', methods=['POST'])
def highlight():
    if not client:
        return jsonify({
            'content': [],
            'message': 'Error: GROQ_API_KEY is missing. Please check your backend .env file.'
        }), 500
        
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data provided'}), 400
        
    content = data.get('content', '')
    highlights_parsed = data.get('highlights', [])
    responses=[]
    
    try:
        print(f"Received {len(highlights_parsed)} highlights to process")
        print(f"Document length: {len(content)} characters")
        
        # Chunk the document
        chunks = chunk_text(content, chunk_size=2000, overlap=200)
        print(f"Split document into {len(chunks)} chunks")
        
        for highlight in highlights_parsed:
            print(f"Processing highlight: {highlight['description']}")
            h = highlight['description']
            all_results = []
            
            try:
                # Process each chunk
                for i, chunk in enumerate(chunks):
                    print(f"  Processing chunk {i+1}/{len(chunks)} (length: {len(chunk)})")
                    
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
                            "content": f"Document:{chunk},Words to highlight:{h}, return a JSON list of the matching words or sentences, depending on the type."
                        }
                        ],
                        temperature=1,
                        max_completion_tokens=1024,
                        top_p=1,
                        stream=False,
                        response_format={"type": "json_object"},
                        stop=None
                    )
                    
                    result = next(iter(json.loads(completion.choices[0].message.content).values()))
                    if result:
                        all_results.extend(result)
                        print(f"  Found {len(result)} highlights in chunk {i+1}")
                
                # Deduplicate results from overlapping chunks
                unique_results = deduplicate_highlights(all_results)
                responses.append(unique_results)
                print(f"Successfully processed: {len(unique_results)} unique highlights (from {len(all_results)} total)")
                
            except Exception as e:
                print(f"Error processing highlight '{h}': {str(e)}")
                responses.append([])  # Add empty list on error
                
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {str(e)}")
        highlights_parsed = []
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({
            'content': [],
            'message': f'Error: {str(e)}'
        }), 500
        
    print(f"Final responses: {responses}")
    return jsonify({
        'content': responses,
        'message': 'Highlights parsed successfully'
    })

if __name__ == '__main__':
    app.run(port=5001, debug=True)
