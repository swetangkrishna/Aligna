FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /code

COPY requirements.txt /code/requirements.txt

RUN pip install \
    --no-cache-dir \
    --upgrade \
    -r /code/requirements.txt

COPY app /code/app

CMD ["fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]