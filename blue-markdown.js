
// next time:
// try using a blue-code-block mode that takes in "```python\n\n\n```"
// and highlights it.

// this means using simple-mode's easy meta syntax for nesting modes. +1

CodeMirror.defineSimpleMode("blue-markdown-styles", {
	start: [
		{regex: /# .+/, token: "header-1", sol: true},
		{regex: /## .+/, token: "header-2", sol: true},
		{regex: /### .+/, token: "header-3", sol: true},
		{regex: /#### .+/, token: "header-4", sol: true},
		{regex: /  - .+/, token: "bullet", sol: true},
		{regex: /  .+/, token: "indent", sol: true}
	]
});

/* mainMode: the default mode
 * nestedDatas: [
 *  {
 *    mode: <mode>,
 *    isStreamStart: <func(stream)>,
 *    isStreamEnd:   <func(stream)>
 *  }
 * ]
 */
function multiplexer(
	mainMode,
	nestedDatas
) { return {
	startState: function() {
		return {
			currentNestedData: null,
			currentNestedState: null,
			mainState: CodeMirror.startState(mainMode)
		};
	},
	copyState: function(s) {
		return {
			currentNestedData: s.currentNestedData,
			currentNestedState: s.currentNestedState,
			mainState: s.mainState
		};
	},
	token: function(stream, state) {
		// SWITCH INTO a nested state
		if (!state.currentNestedData) {
			var newNestedData = _.find(nestedDatas, function (nestedData) {
				return nestedData.isStreamStart(stream);
			});

			if (newNestedData) {
				state.currentNestedData = newNestedData;
				state.currentNestedState = CodeMirror.startState(newNestedData.mode)
				return 'line-code line-code-start';
			}
		}

		// SWITCH OUT of a nested state
		if (state.currentNestedData) {
			if (state.currentNestedData.isStreamEnd(stream)) {
				state.currentNestedData = null;
				state.currentNestedState = null;
				return 'line-code line-code-end';
			}
		}

		// STAY in nested state
		if (state.currentNestedData) {
			var nestedMode = state.currentNestedData.mode;
			var token = nestedMode.token(stream, state.currentNestedState);
			return token + ' line-code';
		}

		// STAY in outer state
		return mainMode.token(stream, state.mainState);
	}
}};


CodeMirror.defineMode("blue-markdown", function(config, parserConfig) {
	function generateNestedModeData(lang) {
		return {
			mode: CodeMirror.getMode(config, lang),
			isStreamStart: function (stream) {
				var re = new RegExp("\\s*```" + lang + "");
				return stream.sol() && stream.match(re) && stream.eol();
			},
			isStreamEnd: function (stream) {
				return stream.sol() && stream.match(/\s*```/) && stream.eol();
			}
		}
	}
	
	return multiplexer(
 		CodeMirror.getMode(config, "blue-markdown-styles"),
 		[
			generateNestedModeData('javascript'),
			generateNestedModeData('python'),
			generateNestedModeData('html')
		]
 	);
});
