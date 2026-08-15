import os
import sys

# Add website-builders/backend directory to python path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'website-builders', 'backend'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import app

# Export WSGI application for Vercel Serverless Function
app = app
