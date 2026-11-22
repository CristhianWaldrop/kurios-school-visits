FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

ARG REQUIREMENTS_FILE=requirements/dev.txt
COPY requirements ./requirements
RUN pip install -r ${REQUIREMENTS_FILE}

COPY . .
RUN DJANGO_SECRET_KEY=build-only python manage.py collectstatic --noinput \
    && chmod +x entrypoint.sh \
    && useradd --system --no-create-home app \
    && chown -R app /app

USER app
EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2"]
