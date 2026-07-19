import concurrent.futures
from flask import Flask

app = Flask(__name__)

def compute_sum(start, end):
    return sum(range(start, end))

@app.route('/')
def index():
    # Use a ThreadPoolExecutor to parallelize the computation
    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = [executor.submit(compute_sum, i * 10**5, (i + 1) * 10**5) for i in range(10)]
        result = sum(future.result() for future in futures)
    
    return f"Result: {result}"

if __name__ == '__main__':
    app.run(debug=True)