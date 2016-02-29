import random
import string
from flask import Flask, render_template
application = Flask(__name__, static_url_path='/static')

@application.route('/')
def home():
    return render_template('index.html', docs_url='/docs')

@application.route('/docs/<doc_id>')
def page(doc_id):
    return render_template('doc.html', doc_id=doc_id)

if __name__ == "__main__":
    application.run(host='0.0.0.0', port=8000, debug=True)
