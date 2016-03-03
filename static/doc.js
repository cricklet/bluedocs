
var defaultText =
	"# Welcome!\n" +
	"\n" +
	"BlueDocs makes you more productive by providing a simple, practical collaborative text editor.\n" +
	"\n" +
	"To collaborate, simply share the url: http://bluedocs.io/docs/" + window.DOCUMENT_ID + "\n" +
	"\n" +
	"Features:\n" +
	" - [x] Markdown highlighting.\n" +
	" - [x] Code highlighting: python, ruby, javascript, and more.\n" +
	" - [x] Collaborative editing.\n" +
	" - [ ] Folders?\n" +
	" - [ ] Share settings?\n" +
	"\n" +
	"\n" +
	"```python\n" +
	"if user.enjoys_blue_docs():\n" +
	"  user.share(user.friends)\n" +
	"\n" +
	"# All feedback is welcome!\n" +
	"user.email('bluedocs.dev@gmail.com', user.generate_feedback())\n" +
	"\n" +
	"# Thanks to the tools that made this project possible!\n" +
	"developer.thank(code_mirror)\n" +
	"developer.thank(fire_pad)\n" +
	"developer.inspired_by(letterspace)\n" +
	"```\n" +
	"\n";

var firepadRef = new Firebase(window.FIREBASE_URL + window.DOCUMENT_ID);

firepadRef.authAnonymously(function(error, authData) {
	if (error) {
		console.log("Login Failed!", error);
	} else {
		console.log("Authenticated successfully with payload:", authData);
	}
});

var codeMirror = CodeMirror(
	document.getElementById('firepad'),
	{
		lineWrapping: true,
		mode: {
			name: 'blue-markdown',
		}
	}
);
var firepad = Firepad.fromCodeMirror(
	firepadRef, codeMirror,	{ defaultText: defaultText }
);

// Hacky hacky hacky. This indents wrapped lines properly.
// Taken from: https://codemirror.net/demo/indentwrap.html
var charWidth = codeMirror.defaultCharWidth(), basePadding = 0;
codeMirror.on("renderLine", function(codeMirror, line, elt) {
	var text = line.text;
	var unindentedText = text.trimLeft();

	var columns = 0;
	columns += CodeMirror.countColumn(line.text, null, codeMirror.getOption("tabSize"));
	if (unindentedText.startsWith("- ")) { columns += 2; }

	var off = columns * charWidth;
	// Remove indent & add padding.
	elt.style.textIndent = "-" + off + "px";
	elt.style.paddingLeft = (basePadding + off) + "px";
});

// More hacky hacky hacky. Because the font-size & font-family are changed
// so dynamically, CodeMirror's character sizing calculations often break.
// Refreshing it seems to solve the problem.
codeMirror.on("focus", function (codeMirror) {
	codeMirror.refresh();
});

document.getElementById('loading').style.display = 'none';
codeMirror.refresh();
