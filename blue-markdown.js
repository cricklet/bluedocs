
// next time:
// try using a blue-code-block mode that takes in "```python\n\n\n```"
// and highlights it.

// this means using simple-mode's easy meta syntax for nesting modes. +1

CodeMirror.defineSimpleMode("blue-markdown-styles", {
	start: [
		{regex: /# /, token: "header-tag line-header-1", sol: true},
		{regex: /## /, token: "header-tag line-header-2", sol: true},
		{regex: /### /, token: "header-tag line-header-3", sol: true},
		{regex: /#### /, token: "header-tag line-header-4", sol: true},
		{regex: /`.*`/, token: "code-quoted"},
		{regex: /\s+- /, token: "bullet", sol: true},
		{regex: /\s+[1-9]+\. /, token: "bullet", sol: true},
		{regex: /\s+/, token: "indent", sol: true}
	]
});

/* defaultMode: the default mode
 * innerHighlighters: [
 *  { // Switch into inner mode after isStart and before isEnd.
 *    mode: <mode>,
 *    isStart: <func(stream)>,
 *    isEnd:   <func(stream)>,
 *    inclusive: false
 *  }
 */
function multiplexer(
	defaultMode,
	innerHighlighters
) { return {
	startState: function() {
		return {
			currentHighlighter: null,
			currentState: null,
			defaultState: CodeMirror.startState(defaultMode)
		};
	},
	copyState: function(s) {
		return {
			currentHighlighter: s.currentHighlighter,
			currentState: s.currentState,
			defaultState: s.defaultState
		};
	},
	token: function(stream, state) {
		// SWITCH INTO a inner state
		if (!state.currentHighlighter) {
			var highlighter = _.find(innerHighlighters, function (innerHighlighter) {
				return innerHighlighter.isStart(stream);
			});

			if (highlighter) {
				state.currentHighlighter = highlighter;
				state.currentState = CodeMirror.startState(highlighter.mode)
				return state.currentHighlighter.innerStartToken;
			}
		}

		// SWITCH OUT of a inner state
		if (state.currentHighlighter) {
			if (state.currentHighlighter.isEnd(stream)) {
				var endToken = state.currentHighlighter.innerEndToken;
				state.currentHighlighter = null;
				state.currentState = null;
				return endToken;
			}
		}

		// STAY in inner state
		if (state.currentHighlighter) {
			var token = state.currentHighlighter.mode.token(stream, state.currentState);
			return token + ' ' + state.currentHighlighter.innerToken;
		}

		// STAY in outer state
		return defaultMode.token(stream, state.defaultState);
	}
}};



CodeMirror.defineMode("blue-markdown", function(config, parserConfig) {
	function generateNestedModeData(lang) {
		return {
			mode: CodeMirror.getMode(config, lang),
			isStart: function (stream) {
				var re = new RegExp("\\s*```" + lang + "");
				return stream.sol() && stream.match(re) && stream.eol();
			},
			isEnd: function (stream) {
				return stream.sol() && stream.match(/\s*```/) && stream.eol();
			},
			innerStartToken: 'line-code line-code-start',
			innerToken: 'line-code',
			innerEndToken: 'line-code line-code-end',
			inclusive: false
		}
	}

	return multiplexer(
 		CodeMirror.getMode(config, "blue-markdown-styles"),
 		[
			// generateNestedModeData('javascript'),
			generateNestedModeData('python'),
			// generateNestedModeData('html')
		]
 	);
});
