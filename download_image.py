import urllib.request
import sys

url = "https://chatgpt.com/backend-api/estuary/public_content/enc/eyJpZCI6Im1fNmE1Y2QxYjJhNjg4ODE5MWIyNzMwNmQzNWU1YTA4MDE6ZmlsZV8wMDAwMDAwMDczY2M4MjQzYWMwZjgwYmYwNjU4ZDE0YiIsImdpem1vX2lkIjpudWxsLCJ0cyI6IjIwNjUzIiwicCI6InB5aSIsImNpZCI6IjEiLCJzaWciOiJhZDg4MjlkYWEwNTQ3ZGM5ZjE0ZDE5NDQ2YWU1YjkyNzJhZDVjZTBjY2RiZTY2OTBiZTJmMTEyNGJlZmNjZjFhIiwidiI6IjAiLCJjcyI6bnVsbCwiY2RuIjpudWxsLCJmbiI6bnVsbCwiY2QiOm51bGwsImNwIjpudWxsLCJtYSI6bnVsbH0="
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response, open(sys.argv[1], 'wb') as out_file:
        out_file.write(response.read())
    print("Downloaded successfully")
except Exception as e:
    print(f"Error: {e}")
