python3 manage.py makemigrations
python3 manage.py migrate
uvicorn base.asgi:application --reload --host 0.0.0.0 --port 8000