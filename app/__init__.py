from flask import Flask
from flask_cors import CORS
from .routes.know_v1 import bp as know_bp
import os

app = Flask(__name__)
origins = os.getenv("CORS_ALLOWLIST","*").split(",")
CORS(app, resources={r"/api/*": {"origins": origins}})
app.register_blueprint(know_bp, url_prefix="/api/know/v1")

@app.get("/api/healthz")
def healthz(): return {"ok": True}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
