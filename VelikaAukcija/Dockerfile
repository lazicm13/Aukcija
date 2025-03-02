FROM python:3.10-slim

# Set environment variable
ENV PYTHONUNBUFFERED 1

# Set the working directory
WORKDIR /code

# Install dependencies
COPY /VelikaAukcija/requirements.txt /code/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . /code/

# Expose port 8000 for the application
EXPOSE 8000

# Set the command to run gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "VelikaAukcija.backend.wsgi:application"]
