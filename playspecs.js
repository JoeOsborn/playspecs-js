var Playspecs =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.hi = hi;
	
	var _parser = __webpack_require__(1);
	
	function hi() {
	    console.log("hello there");
	}
	
	exports.Parser = { Parser: _parser.Parser, tokenTypes: _parser.tokenTypes };
	
	//const Parser = require("parser.js").Parser;
	//
	//var p = new Parser();
	//
	//console.log(p);
	//
	//export Parser;

/***/ },
/* 1 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var tokenTypes = {
	    WHITESPACE: " ",
	    CONCATENATION: ",",
	    // Bounding integers are tokenized as part of the dots to minimize potential conflicts with user-provided syntax.
	    DOTS_GREEDY: "...",
	    DOTS_RELUCTANT: "..",
	    DOTS_OMEGA: "***",
	    LEFT_PAREN: "(",
	    RIGHT_PAREN: ")",
	    ALTERNATION: ";",
	    INTERSECTION: "^",
	    AND: "&",
	    OR: "|",
	    NOT: "not",
	    START: "start",
	    END: "end",
	    ERROR: "error"
	};
	
	exports.tokenTypes = tokenTypes;
	var standardTokens = [{
	    type: tokenTypes.WHITESPACE,
	    match: /^\s+/
	}, {
	    type: tokenTypes.CONCATENATION,
	    match: [tokenTypes.CONCATENATION]
	}, {
	    type: tokenTypes.DOTS_GREEDY,
	    match: /^([0-9]*)\s*\.\.\.\s*([0-9]*)/
	}, {
	    type: tokenTypes.DOTS_RELUCTANT,
	    match: /^([0-9]*)\s*\.\.\s*([0-9]*)/
	}, {
	    type: tokenTypes.DOTS_OMEGA,
	    match: [tokenTypes.DOTS_OMEGA]
	}, {
	    type: tokenTypes.LEFT_PAREN,
	    match: [tokenTypes.LEFT_PAREN]
	}, {
	    type: tokenTypes.RIGHT_PAREN,
	    match: [tokenTypes.RIGHT_PAREN]
	}, {
	    type: tokenTypes.ALTERNATION,
	    match: [tokenTypes.ALTERNATION]
	}, {
	    type: tokenTypes.INTERSECTION,
	    match: [tokenTypes.INTERSECTION]
	}, {
	    type: tokenTypes.AND,
	    match: [tokenTypes.AND]
	}, {
	    type: tokenTypes.OR,
	    match: [tokenTypes.OR]
	}, {
	    type: tokenTypes.NOT,
	    match: [tokenTypes.NOT]
	}, {
	    type: tokenTypes.START,
	    match: [tokenTypes.START]
	}, {
	    type: tokenTypes.END,
	    match: [tokenTypes.END]
	}, {
	    type: tokenTypes.ERROR,
	    match: /^\S+/
	}];
	
	exports.standardTokens = standardTokens;
	
	var Parser = (function () {
	    function Parser(context) {
	        _classCallCheck(this, Parser);
	
	        this.tokenDefinitions = [];
	        this.tokensByType = {};
	        var tokens = (context.tokens || []).concat(standardTokens);
	        for (var ti = 0; ti < tokens.length; ti++) {
	            var input = tokens[ti];
	            var defn = {
	                type: input.type,
	                match: input.match instanceof String ? [input.match] : input.match,
	                value: input.value || function (mr) {
	                    return mr[0];
	                },
	                tightness: input.tightness || 0,
	                startParse: input.startParse || function (_parser, token) {
	                    return token;
	                },
	                extendParse: input.extendParse || function (parser, token, parseTree) {
	                    return parser.error("Can't extend a parse tree with a value type", token, parseTree);
	                }
	            };
	            this.tokenDefinitions.push(defn);
	            this.tokensByType[defn.type] = defn;
	        }
	    }
	
	    _createClass(Parser, [{
	        key: "tokenize",
	        value: function tokenize(str) {
	            var result = [];
	            var errors = [];
	            var substring = str;
	            var index = 0;
	            while (substring.length) {
	                for (var ti = 0; ti < this.tokenDefinitions.length; ti++) {
	                    var tokenDefinition = this.tokenDefinitions[ti];
	                    var _match = tokenDefinition.match;
	                    var matchResult = null;
	                    if (_match instanceof RegExp) {
	                        matchResult = _match.exec(substring);
	                    } else if (Array.isArray(_match)) {
	                        for (var mi = 0; mi < _match.length; mi++) {
	                            var candidate = _match[mi];
	                            if (substring.substr(0, candidate.length) == candidate) {
	                                matchResult = [candidate];
	                                matchResult.index = 0;
	                            }
	                        }
	                    }
	                    if (matchResult && matchResult.index == 0) {
	                        var matchLength = matchResult[0].length;
	                        substring = substring.substr(matchResult[0].length);
	                        var oldIndex = index;
	                        index += matchLength;
	                        if (tokenDefinition.type !== tokenTypes.WHITESPACE) {
	                            if (tokenDefinition.type === tokenTypes.ERROR) {
	                                errors.push(result.length);
	                            }
	                            result.push({
	                                type: tokenDefinition.type,
	                                value: tokenDefinition.value(matchResult),
	                                range: { start: oldIndex, end: index },
	                                definition: tokenDefinition
	                            });
	                        }
	                        break;
	                    }
	                }
	            }
	            return { tokens: result, position: 0, errors: errors };
	        }
	    }]);
	
	    return Parser;
	})();
	
	exports.Parser = Parser;

/***/ }
/******/ ]);
//# sourceMappingURL=playspecs.js.map