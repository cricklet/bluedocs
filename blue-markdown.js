
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
		{regex: /```.+/, token: "code-block",
		 next: "code_block", sol: true, eol: true}
	],
	code_block: [
		{regex: /```/, token: "code-block", next: "start", sol: true, eol: true},
		{regex: /.*/, token: "code-block"}
	],
});


var codeOverlay = {
  startState: function() {
    return {
      codeBlock: false,
			codeLang: ''
    };
  },
  copyState: function(s) {
    return {
      codeBlock: s.codeBlock,
			codeLang: s.codeLang
    };
  },
  token: function(stream, state) {
		if (state.codeBlock) {
			var isEnd = stream.sol() && stream.match(/```/) && stream.eol();
			if (isEnd) {
				state.codeBlock = false;
				state.codeLang = null;
				return null;
			}
		}

		if (state.codeBlock) {
			stream.skipToEnd();
			return null;
		}
		
		if (!state.codeBlock) {
			var isBeginning = stream.sol() && stream.match(/```.+/) && stream.eol();
			state.codeBlock = true;
			state.codeLang = stream.current().substr(3);
			return null;
		}
		
		stream.next();
		return null;
  },
	innerMode: function (state) {
		console.log(state.codeLang);
		return {state: {}, mode: state.codeLang};
	}
};


CodeMirror.defineMode("blue-markdown", function(config, parserConfig) {
	return CodeMirror.overlayMode(
		CodeMirror.getMode(config, "blue-markdown-styles"),
		codeOverlay
	);
});
