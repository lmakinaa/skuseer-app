FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN apt-get update && apt-get install -y libgomp1
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

#RUN chmod +x /app/entrypoint.sh

EXPOSE 8001

#ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
