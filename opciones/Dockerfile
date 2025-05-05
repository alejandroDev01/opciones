
FROM python:3.9-slim

WORKDIR /app

# Instalamos solo las dependencias necesarias
RUN pip install --no-cache-dir requests pysocks

# Copiamos solo los archivos necesarios
COPY proxy_tester.py config/proxy_config.py ./

# Variables de entorno opcionales
ENV MAX_WORKERS=20
ENV TEST_TIMEOUT=5
ENV TEST_URL="http://httpbin.org/ip"

# Ejecutar como usuario no-root por seguridad
RUN useradd -m appuser && chown -R appuser /app
USER appuser

CMD ["python", "test.py"]