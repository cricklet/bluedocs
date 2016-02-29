FROM python
RUN pip install -r requirements.txt

CMD gunicorn blue_server:app --log-file -

