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
	var parseValue = function parseValue(parser, token) {
	    return parser.node(token.type, token.value);
	};
	
	exports.parseValue = parseValue;
	var parseInfixR = function parseInfixR(parser, left, token) {
	    var children = [left];
	    children.push(parser.parseExpression(token.tightness));
	    return parser.node(token.type, token.value, children);
	};
	
	exports.parseInfixR = parseInfixR;
	var parseInfixRPropositional = function parseInfixRPropositional(parser, left, token) {
	    if (!parser.isPropositional(left)) {
	        return parser.error("Left hand side of token must be propositional", token, left);
	    }
	    var children = [left];
	    var right = parser.parseExpression(token.tightness);
	    if (!parser.isPropositional(right)) {
	        return parser.error("Right hand side of token must be propositional", token, right);
	    }
	    children.push(right);
	    return parser.node(token.type, token.value, children);
	};
	
	exports.parseInfixRPropositional = parseInfixRPropositional;
	var BOUND_INFINITE = "$END";
	
	var standardTokens = [{
	    type: tokenTypes.WHITESPACE,
	    match: /^\s+/
	}, {
	    type: tokenTypes.CONCATENATION,
	    match: [tokenTypes.CONCATENATION],
	    tightness: 100,
	    extendParse: parseInfixR
	}, {
	    type: tokenTypes.DOTS_GREEDY,
	    match: /^([0-9]*)\s*\.\.\.\s*([0-9]*)/,
	    value: function value(matchResult) {
	        return {
	            greedy: true,
	            lowerBound: matchResult[1] ? parseInt(matchResult[1]) : 0,
	            upperBound: matchResult[2] ? parseInt(matchResult[2]) : BOUND_INFINITE
	        };
	    },
	    tightness: 110,
	    startParse: parseValue,
	    extendParse: function extendParse(parser, left, token) {
	        //TODO: Handle parse errors
	        return parser.node(token.type, token, [left]);
	    }
	}, {
	    type: tokenTypes.DOTS_RELUCTANT,
	    match: /^([0-9]*)\s*\.\.\s*([0-9]*)/,
	    tightness: 110,
	    value: function value(matchResult) {
	        return {
	            greedy: false,
	            lowerBound: matchResult[1] ? parseInt(matchResult[1]) : 0,
	            upperBound: matchResult[2] ? parseInt(matchResult[2]) : BOUND_INFINITE
	        };
	    },
	    startParse: parseValue,
	    extendParse: function extendParse(parser, left, token) {
	        //TODO: Handle parse errors
	        return parser.node(token.type, token, [left]);
	    }
	}, {
	    type: tokenTypes.DOTS_OMEGA,
	    match: [tokenTypes.DOTS_OMEGA],
	    tightness: 110,
	    startParse: parseValue,
	    extendParse: function extendParse(parser, left, token) {
	        //TODO: Handle parse errors
	        return parser.node(token.type, token, [left]);
	    }
	}, {
	    type: tokenTypes.LEFT_PAREN,
	    match: [tokenTypes.LEFT_PAREN],
	    startParse: function startParse(parser, token) {
	        //parse an expression at RBP 0, then eat a )
	        var expr = parser.parseExpression(0);
	        if (parser.currentToken().type != tokenTypes.RIGHT_PAREN) {
	            return parser.error("Missing right parenthesis", token, expr);
	        }
	        return parser.node(token.type, token.value, [expr]);
	    }
	}, {
	    type: tokenTypes.RIGHT_PAREN,
	    match: [tokenTypes.RIGHT_PAREN]
	}, {
	    type: tokenTypes.ALTERNATION,
	    match: [tokenTypes.ALTERNATION],
	    tightness: 60,
	    extendParse: parseInfixR
	}, {
	    type: tokenTypes.INTERSECTION,
	    match: [tokenTypes.INTERSECTION],
	    tightness: 50,
	    extendParse: parseInfixR
	}, {
	    type: tokenTypes.AND,
	    match: [tokenTypes.AND],
	    tightness: 200,
	    extendParse: parseInfixRPropositional
	}, {
	    type: tokenTypes.OR,
	    match: [tokenTypes.OR],
	    tightness: 210,
	    extendParse: parseInfixRPropositional
	}, {
	    type: tokenTypes.NOT,
	    match: [tokenTypes.NOT],
	    tightness: 220,
	    startParse: function startParse(parser, token) {
	        var phi = parser.parseExpression(token.tightness);
	        if (!parser.isPropositional(phi)) {
	            return parser.error("NOT may only negate propositional state formulae", token, phi);
	        }
	        return parser.node(token.type, token, [phi]);
	    }
	}, {
	    type: tokenTypes.START,
	    match: [tokenTypes.START],
	    startParse: parseValue
	}, {
	    type: tokenTypes.END,
	    match: [tokenTypes.END],
	    startParse: parseValue
	}, {
	    type: tokenTypes.ERROR,
	    match: /^\S+/,
	    startParse: parseValue
	}];
	
	exports.standardTokens = standardTokens;
	var ERROR = "ERROR";
	
	function isString(s) {
	    return typeof s === "string" || s instanceof String;
	}
	
	var Parser = (function () {
	    function Parser(context) {
	        _classCallCheck(this, Parser);
	
	        this.tokenDefinitions = [];
	        this.tokensByType = {};
	        this.parseErrors = [];
	        var customTokens = context.tokens || [];
	        var tokens = customTokens.concat(standardTokens);
	        for (var ti = 0; ti < tokens.length; ti++) {
	            var input = tokens[ti];
	            var defn = {
	                type: input.type,
	                match: isString(input.match) ? [input.match] : input.match,
	                value: input.value || function (mr) {
	                    return mr[0];
	                },
	                tightness: input.tightness || 0,
	                startParse: input.startParse || function (parser, token) {
	                    return parser.error("Can't start a parse tree with this token", token);
	                },
	                extendParse: input.extendParse || function (parser, token, parseTree) {
	                    return parser.error("Can't extend a parse tree with this token", token, parseTree);
	                }
	            };
	            this.tokenDefinitions.push(defn);
	            this.tokensByType[defn.type] = defn;
	        }
	        this.resetStream();
	    }
	
	    _createClass(Parser, [{
	        key: "node",
	        value: function node(type) {
	            var value = arguments.length <= 1 || arguments[1] === undefined ? undefined : arguments[1];
	            var children = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];
	
	            return { type: type, value: value, children: children, range: { start: -1, end: -1 } };
	        }
	    }, {
	        key: "error",
	        value: function error(msg, token) {
	            var tree = arguments.length <= 2 || arguments[2] === undefined ? undefined : arguments[2];
	
	            var err = node(ERROR, { message: msg, token: token, tree: tree });
	            this.parseErrors.push(err);
	            return err;
	        }
	    }, {
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
	                                range: { start: oldIndex, end: index }
	                            });
	                        }
	                        break;
	                    }
	                }
	            }
	            return { string: str, tokens: result, position: 0, errors: errors };
	        }
	    }, {
	        key: "isCustom",
	        value: function isCustom(p) {
	            return !(p.type in tokenTypes);
	        }
	    }, {
	        key: "isPropositional",
	        value: (function (_isPropositional) {
	            function isPropositional(_x) {
	                return _isPropositional.apply(this, arguments);
	            }
	
	            isPropositional.toString = function () {
	                return _isPropositional.toString();
	            };
	
	            return isPropositional;
	        })(function (p) {
	            return isCustom(p) || p.type == tokenTypes.AND || p.type == tokenTypes.OR || p.type == tokenTypes.NOT || p.type == tokenTypes.START || p.type == tokenTypes.END || p.type == tokenTypes.LEFT_PAREN && p.children.every(isPropositional);
	        })
	    }, {
	        key: "resetStream",
	        value: function resetStream() {
	            this.stream = { string: "", tokens: [], position: 0, errors: [] };
	        }
	    }, {
	        key: "charPosition",
	        value: function charPosition() {
	            return currentToken() ? currentToken().range.start : this.stream.string.length;
	        }
	    }, {
	        key: "remainder",
	        value: function remainder() {
	            var end = charPosition();
	            return this.stream.string.substr(end);
	        }
	    }, {
	        key: "currentToken",
	        value: function currentToken() {
	            return this.stream.tokens[this.stream.position];
	        }
	    }, {
	        key: "advance",
	        value: function advance() {
	            this.stream.position++;
	        }
	    }, {
	        key: "parse",
	        value: function parse(str) {
	            this.stream = this.tokenize(str);
	            this.parseErrors = [];
	            var tree = parseExpression(0);
	            var result = { tree: tree, errors: this.parseErrors, remainder: remainder() };
	            this.parseErrors = [];
	            resetStream();
	            return result;
	        }
	    }, {
	        key: "parseExpression",
	        value: function parseExpression(tightness) {
	            var token = currentToken();
	            var start = token.range.start;
	            advance();
	            var tree = token.startParse(this, token);
	            tree.range.start = start;
	            tree.range.end = charPosition();
	            if (tree.type == ERROR) {
	                return tree;
	            }
	            token = currentToken();
	            while (token && tightness < token.tightness) {
	                advance();
	                var newTree = token.extendParse(this, tree, token);
	                newTree.range.start = tree.range.start;
	                newTree.range.end = charPosition();
	                if (newTree.type == ERROR) {
	                    return newTree;
	                }
	                tree = newTree;
	                token = currentToken();
	            }
	            return tree;
	        }
	    }]);
	
	    return Parser;
	})();
	
	exports.Parser = Parser;

/***/ }
/******/ ]);
//# sourceMappingURL=playspecs.js.map