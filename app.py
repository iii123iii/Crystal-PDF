from flask import Flask, request, jsonify

app = Flask(__name__)

# List of keywords that indicate a request for sensitive information
sensitive_keywords = [".env", "environment variables", "API key", "database credentials"]

@app.before_request
def check_sensitive_requests():
    # Check if the incoming request contains any sensitive keywords
    for keyword in sensitive_keywords:
        if keyword.lower() in request.data.decode('utf-8').lower():
            app.logger.warning(f"Rejected request for sensitive information: {request.data}")
            return jsonify({"error": "Request for sensitive information is not allowed."}), 403

@app.route('/')
def home():
    return "Welcome to the secure application!"

if __name__ == '__main__':
    app.run(debug=True)