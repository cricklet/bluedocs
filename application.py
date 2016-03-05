import os
import random
import string
import shutil
from flask import Flask, render_template
from cssmin import cssmin
from jsmin import jsmin
from pdb import set_trace
from pprint import pprint as pp

DEBUG = __name__ == "__main__"
STATIC_FOLDER = 'static'
SOURCE_FOLDER = 'assets'

# Get a recursive list of (subdir, filename) under the SOURCE_FOLDER
# i.e. static/blue.js, 'static/font/blue.ttf
#   => ('static', 'blue.js'), ('static/font', 'blue.ttf')
walked_files = os.walk(SOURCE_FOLDER)
subdir_files = sum([
    [(subdir, filename) for filename in files]
    for subdir, dirs, files in walked_files
], [])

# Compute a list of minified files to create
new_subdir_files = [
    (STATIC_FOLDER + subdir.lstrip(SOURCE_FOLDER), filename)
    for subdir, filename in subdir_files
]

def minify(subdir, filename, new_subdir, new_filename):
    path = subdir + '/' + filename
    new_path = new_subdir + '/' + new_filename

    # Make sure the folder exists
    if not os.path.exists(new_subdir):
        os.makedirs(new_subdir)

    if filename.endswith('.js') and not DEBUG:
        # Minify JS
        source = open(path).read()
        source_min = jsmin(source)
        open(new_path, 'w').write(source_min)

    elif filename.endswith('.css') and not DEBUG:
        # Minify CSS
        source = open(path).read()
        source_min = cssmin(source)
        open(new_path, 'w').write(source_min)

    else:
        # Or just copy
        shutil.copyfile(path, new_path)

# Minify each!
for (subdir, filename), (new_subdir, new_filename) in zip(subdir_files, new_subdir_files):
    minify(subdir, filename, new_subdir, new_filename)

application = Flask(
    __name__,
    static_url_path='/static'
)

@application.route('/')
def home():
    return render_template('index.html', docs_url='/docs')

@application.route('/docs/<doc_id>')
def page(doc_id):
    return render_template('doc.html', doc_id=doc_id)

if DEBUG:
    application.run(host='0.0.0.0', port=8000, debug=True)
