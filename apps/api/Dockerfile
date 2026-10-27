FROM python:3.12-slim

ARG INSTALL_DEV=0

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /srv/backend

COPY . .
RUN if [ "$INSTALL_DEV" = "1" ]; then pip install ".[dev]"; else pip install .; fi \
    && useradd --create-home --uid 10001 app \
    && chown -R app /srv/backend

USER app

EXPOSE 8000

# Migrations run as an explicit step (see README), not on every start.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
