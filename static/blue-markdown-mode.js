var LINK_REGEX = /\[[^\[\]\(\)]+\]\([^\[\]\(\)]+\)/;
var HREF_REGEX = /(https?|ftp):\/\/[^\s/$.?#].[^\s]*/;
var EMAIL_REGEX = /[^@^\s]+@[^@^\s]+\.[^@^\s]+/;

CodeMirror.defineSimpleMode("blue-markdown-styles", {
	start: [
		{regex: /# /, token: "header-tag line-header-1", sol: true},
		{regex: /## /, token: "header-tag line-header-2", sol: true},
		{regex: /### /, token: "header-tag line-header-3", sol: true},
		{regex: /#### /, token: "header-tag line-header-4", sol: true},
		{regex: LINK_REGEX, token: ""},
		{regex: HREF_REGEX, token: "link-href"},
		{regex: EMAIL_REGEX, token: "email-href"},
		{regex: /`.*`/, token: "code-quoted"},
		{regex: /\s+- /, token: "bullet", sol: true},
		{regex: /\s+[0-9]+\. /, token: "bullet", sol: true},
		{regex: /\s+/, token: "indent", sol: true}
	]
});

LINK_TEXT_OPEN  = 6;
LINK_TEXT       = 5;
LINK_TEXT_CLOSE = 4;
LINK_HREF_OPEN  = 3;
LINK_HREF       = 2;
LINK_HREF_CLOSE = 1;

function linkHighlightMode() { return {
	/**
   * A mode for highlighting [links](linky.com).
   */
	startState: function() {
		return {
			status: 0
		};
	},
	copyState: function(s) {
		return {
			status: s.status
		};
	},
	token: function(stream, state) {
		var returnToken = '';

		if (state.status == LINK_TEXT) {
			stream.match(/[^\[\]\(\)]+/);
			returnToken += 'link-text';

		} else if (state.status == LINK_HREF) {
			stream.match(/[^\[\]\(\)]+/);
			returnToken += 'link-href';

		} else if (state.status == LINK_TEXT_CLOSE ||
							 state.status == LINK_HREF_OPEN ||
							 state.status == LINK_HREF_CLOSE) {
			// Increment once
			stream.next();
			returnToken += 'link-tag';

		} else if(stream.match(LINK_REGEX)) {
			state.status = LINK_TEXT_OPEN;
			stream.backUp(stream.current().length);

			// Increment only the first paren;
			stream.next();
			returnToken += 'link-tag';
		}

		state.status --;

		return returnToken;
	}
}}

CHECKBOX_INDENT = 4;
CHECKBOX_OPEN = 3;
CHECKBOX_VALUE = 2;
CHECKBOX_CLOSE = 1;

function checkboxHighlighter() { return {
	/**
   * A mode for highlighting " - [ ] Checkboxes"
   */
	startState: function() {
		return {
			status: 0
		};
	},
	copyState: function(s) {
		return {
			status: s.status
		};
	},
	token: function(stream, state) {
		var returnToken = '';

		if (state.status == CHECKBOX_OPEN || state.status == CHECKBOX_CLOSE) {
			stream.next();
			returnToken += 'checkbox-tag';

		} else if (state.status == CHECKBOX_VALUE) {
			stream.match(/[ ?xXoO]/);
			returnToken += 'checkbox-value';

		} else if(stream.sol() && stream.match(/\s*([0-9]\. |- |)\[[ xXoO\?]\]/)) {
			stream.backUp(3);
			state.status = CHECKBOX_INDENT;

		} else {
			stream.skipToEnd();
		}

		state.status --;

		return returnToken;
	}
}}

function multiplexerMode(
	defaultMode,
	innerHighlighters
) {
	/**
   * This mode lets you switch between a default mode and multiple,
   * inner modes called 'highlighters.'
   *
   * defaultMode: the default mode
	 * innerHighlighters: [
	 *  { // Switch into inner mode after isStart and before isEnd.
	 *    mode: <mode>,
	 *    isStart: <func(stream)>,
	 *    isEnd:   <func(stream)>,
	 *  }
	 * ]
	 */
	return {
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

function genZero () {return 0;}
function genEmpty () {return '';}
function decrement (x) {return x - 1;}

function simulModes(modes) {
	/**
   * This mode lets you run multiple modes *at the same time*,
   * making it ridiculously easier to compose different modes.
   */
	return {
		startState: function () {
			return {
				states: _.map(modes, function (mode) {
					return CodeMirror.startState(mode);
				}),
				countdowns: _.map(modes, genZero),
				tokens: _.map(modes, genEmpty)
			};
		},
		copyState: function(s) {
			return {
				states: _.map(modes, function (mode, index) {
					var state = s.states[index];
					return mode.copyState(state);
				}),
				countdowns: _.clone(s.countdowns),
				tokens:     _.clone(s.tokens)
			};
		},
		token: function(stream, state) {
			var returnTokens = '';

			_.each(modes, function (mode, index) {
				var modeState     = state.states[index];
				var modeCountdown = state.countdowns[index];
				var modeToken     = state.tokens[index];

				if (modeCountdown > 0) {
					// Add the previous token if a countdown is going on.
					returnTokens += ' ' + state.tokens[index];
				} else {
					// Otherwise, feed the stream to the mode.
					modeToken = mode.token(stream, modeState);
					modeCountdown = stream.current().length;

					returnTokens += ' ' + modeToken;
					stream.backUp(modeCountdown);
				}

				state.states[index]     = modeState;
				state.countdowns[index] = modeCountdown;
				state.tokens[index]     = modeToken;
			});

			// Decrement countdowns
			state.countdowns = _.map(state.countdowns, decrement);

			// Increment stream by one!
			stream.next();

			return returnTokens;
		}
	}
}

function generateCodeHighlighter(lang) {
	return {
		mode: CodeMirror.getMode({}, lang),
		isStart: function (stream) {
			var re = new RegExp("\\s*```" + lang + "");
			return stream.sol() && stream.match(re) && stream.eol();
		},
		isEnd: function (stream) {
			return stream.sol() && stream.match(/\s*```/) && stream.eol();
		},
		innerStartToken: 'line-code line-code-start',
		innerToken: 'line-code',
		innerEndToken: 'line-code line-code-end'
	}
}


CodeMirror.defineMode("blue-markdown", function(config, parserConfig) {
	return simulModes([
		multiplexerMode(
 			CodeMirror.getMode({}, "blue-markdown-styles"),
 			[
				generateCodeHighlighter('javascript'),
				generateCodeHighlighter('python'),
				generateCodeHighlighter('html')
			]
		),
		linkHighlightMode(),
		checkboxHighlighter()
	]);
});
