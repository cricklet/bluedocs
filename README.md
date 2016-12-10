# BlueDocs

A simple collaborative markdown editor (with beautiful GFM highlighting) I built using FirePad's collaborative editing implementation.

The most interesting file is, by a large margin, the [GitHub-markdown-flavor highlighting mode](https://github.com/cricklet/bluedocs/blob/master/assets/blue-markdown-mode.js) I built with CodeMirror. To manage the complexity of having multiple highlighting patterns (i.e. `python` highlighting within a markdown document), I implemented some higher-order functions that compose multiple other text highlighters.

```javascript
CodeMirror.defineMode("blue-markdown", function(config, parserConfig) {
	return simulModes([
		multiplexerMode(
 			CodeMirror.getMode({}, "blue-markdown-styles"),
 			[
				generateCodeHighlighter('javascript', CodeMirror.getMode({}, 'javascript')),
				generateCodeHighlighter('python', CodeMirror.getMode({}, 'python')),
				generateCodeHighlighter('html', CodeMirror.getMode({}, 'html')),
				generateCodeHighlighter('', tokenMode('line-code-unformatted'))
			]
		),
		linkHighlightMode(),
		checkboxHighlighter()
	]);
});
```

![](http://i.imgur.com/Qo3dRiL.png)
