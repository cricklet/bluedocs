import random
import string
from flask import Flask, render_template
app = Flask(__name__, static_url_path='/static')

@app.route('/')
def home():
    return render_template('index.html', docs_url='/docs')

@app.route('/docs/<doc_id>')
def page(doc_id):
    return render_template('doc.html', doc_id=doc_id)

if __name__ == "__main__":
    app.run(debug=True)
