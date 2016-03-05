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
STATIC_MIN_FOLDER = 'static_min'

# Compile a list of files to minify
subdir_files_per_directory = [
    [(subdir, filename) for filename in files]
    for subdir, dirs, files in os.walk(STATIC_FOLDER)
]
subdir_files = sum(subdir_files_per_directory, [])

# Minify each!
for subdir, filename in subdir_files:
    new_subdir = STATIC_MIN_FOLDER + subdir.lstrip(STATIC_FOLDER)

    path = subdir + '/' + filename
    new_path = new_subdir + '/' + filename

    # Make sure the folder exists
    if not os.path.exists(new_subdir):
        os.makedirs(new_subdir)

    if filename.endswith('.js'):
        # Minify JS
        source = open(path).read()
        source_min = jsmin(source)
        open(new_path, 'w').write(source_min)

    elif filename.endswith('.css'):
        # Minify CSS
        source = open(path).read()
        source_min = cssmin(source)
        open(new_path, 'w').write(source_min)

    else:
        # Or just copy
        shutil.copyfile(path, new_path)

static_folder = STATIC_FOLDER if DEBUG else STATIC_MIN_FOLDER

application = Flask(
    __name__,
    static_url_path='/static',
    static_folder=static_folder
)

@application.route('/')
def home():
    return render_template('index.html', docs_url='/docs')

@application.route('/docs/<doc_id>')
def page(doc_id):
    return render_template('doc.html', doc_id=doc_id)

if DEBUG:
    application.run(host='0.0.0.0', port=8000, debug=True)
