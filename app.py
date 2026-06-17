import os
import time
import requests
import feedparser
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
CACHE_DURATION = 300  # 5 minutes in seconds

# In-memory cache
feed_cache = {
    "data": None,
    "last_fetched": 0
}

def fetch_and_parse_feed(force=False):
    now = time.time()
    if not force and feed_cache["data"] and (now - feed_cache["last_fetched"] < CACHE_DURATION):
        return feed_cache["data"], True  # Return cached data

    # Fetch the feed
    response = requests.get(FEED_URL, timeout=10)
    response.raise_for_status()
    
    # Parse the XML feed
    feed = feedparser.parse(response.content)
    
    notes = []
    for entry in feed.entries:
        # Get content
        content_val = ""
        if "content" in entry and len(entry.content) > 0:
            content_val = entry.content[0].value
        elif "summary" in entry:
            content_val = entry.summary
            
        note = {
            "id": entry.get("id", entry.get("link", "")),
            "title": entry.get("title", "BigQuery Update"),
            "link": entry.get("link", ""),
            "updated": entry.get("updated", ""),
            "published": entry.get("published", ""),
            "content": content_val
        }
        notes.append(note)
        
    feed_cache["data"] = notes
    feed_cache["last_fetched"] = now
    return notes, False

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/notes")
def get_notes():
    force = request.args.get("force", "false").lower() == "true"
    try:
        notes, cached = fetch_and_parse_feed(force=force)
        return jsonify({
            "status": "success",
            "cached": cached,
            "count": len(notes),
            "notes": notes
        })
    except Exception as e:
        # Fallback to cache if request fails
        if feed_cache["data"]:
            return jsonify({
                "status": "success",
                "cached": True,
                "warning": f"Could not refresh: {str(e)}. Showing cached data.",
                "count": len(feed_cache["data"]),
                "notes": feed_cache["data"]
            })
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
