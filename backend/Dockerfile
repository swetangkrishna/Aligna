FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PGSSLROOTCERT=/code/certs/supabase-ca.crt

WORKDIR /code

COPY requirements.txt /code/requirements.txt

RUN pip install \
    --no-cache-dir \
    --upgrade \
    -r /code/requirements.txt

COPY app /code/app
COPY alembic.ini /code/alembic.ini
COPY migrations /code/migrations
COPY certs /code/certs

CMD ["fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
