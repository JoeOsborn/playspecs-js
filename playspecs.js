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
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }
	
	var _parser = __webpack_require__(1);
	
	var Parser = _interopRequireWildcard(_parser);
	
	function hi() {
	    console.log("hello there");
	}
	
	exports.Parser = Parser;
	
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
	    TRUE: "true",
	    FALSE: "false",
	    ERROR: "error"
	};
	
	exports.tokenTypes = tokenTypes;
	var parseTypes = {
	    OMEGA: tokenTypes.OMEGA,
	    REPETITION: tokenTypes.DOTS_GREEDY,
	    CONCATENATION: tokenTypes.CONCATENATION,
	    GROUP: tokenTypes.LEFT_PAREN,
	    ALTERNATION: tokenTypes.ALTERNATION,
	    INTERSECTION: tokenTypes.INTERSECTION,
	    AND: tokenTypes.AND,
	    OR: tokenTypes.OR,
	    NOT: tokenTypes.NOT,
	    START: tokenTypes.START,
	    END: tokenTypes.END,
	    TRUE: tokenTypes.TRUE,
	    FALSE: tokenTypes.FALSE,
	    ERROR: tokenTypes.ERROR
	};
	
	exports.parseTypes = parseTypes;
	var constantValue = function constantValue(c) {
	    return function (_mr) {
	        return c;
	    };
	};
	
	exports.constantValue = constantValue;
	var parseValue = function parseValue(parser, token) {
	    return parser.node(token.type, token.value);
	};
	
	exports.parseValue = parseValue;
	var parseInfixR = function parseInfixR(parser, left, token) {
	    var children = [left];
	    children.push(parser.parseExpression(token.tightness - 1));
	    return parser.node(token.type, token.value, children);
	};
	
	exports.parseInfixR = parseInfixR;
	var parseInfixRPropositional = function parseInfixRPropositional(parser, left, token) {
	    if (!parser.isPropositional(left)) {
	        return parser.error("Left hand side of token must be propositional", token, left);
	    }
	    var children = [left];
	    var right = parser.parseExpression(token.tightness - 1);
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
	    startParse: function startParse(parser, token) {
	        return parser.node(parseTypes.REPETITION, token.value, [parser.node(parseTypes.TRUE, true)]);
	    },
	    extendParse: function extendParse(parser, left, token) {
	        //TODO: Handle parse errors
	        return parser.node(parseTypes.REPETITION, token.value, [left]);
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
	    startParse: function startParse(parser, token) {
	        return parser.node(parseTypes.REPETITION, token.value, [parser.node(parseTypes.TRUE, true)]);
	    },
	    extendParse: function extendParse(parser, left, token) {
	        //TODO: Handle parse errors
	        return parser.node(parseTypes.REPETITION, token.value, [left]);
	    }
	}, {
	    type: tokenTypes.DOTS_OMEGA,
	    match: [tokenTypes.DOTS_OMEGA],
	    tightness: 110,
	    startParse: function startParse(parser, token) {
	        return parser.node(parseTypes.OMEGA, token.value, [parser.node(parseTypes.TRUE, true)]);
	    },
	    extendParse: function extendParse(parser, left, token) {
	        //TODO: Handle parse errors
	        return parser.node(parseTypes.OMEGA, token.value, [left]);
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
	        return parser.node(token.type, token.value, [phi]);
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
	    type: tokenTypes.TRUE,
	    match: [tokenTypes.TRUE],
	    value: constantValue(true),
	    startParse: parseValue
	}, {
	    type: tokenTypes.FALSE,
	    match: [tokenTypes.FALSE],
	    value: constantValue(false),
	    startParse: parseValue
	}, {
	    type: tokenTypes.ERROR,
	    match: /^\S+/,
	    startParse: parseValue
	}];
	
	exports.standardTokens = standardTokens;
	var customTightnessOffset = 300;
	
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
	            var _tightness = input.tightness || 0;
	            var defn = {
	                type: input.type,
	                match: isString(input.match) ? [input.match] : input.match,
	                value: input.value || function (mr) {
	                    return mr[0];
	                },
	                tightness: ti < customTokens.length ? _tightness + customTightnessOffset : _tightness,
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
	
	            var err = this.node(ERROR, { message: msg, token: token, tree: tree });
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
	                                tightness: tokenDefinition.tightness,
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
	            return !(p.type in parseTypes);
	        }
	    }, {
	        key: "isPropositional",
	        value: function isPropositional(p) {
	            return this.isCustom(p) || p.type == parseTypes.AND || p.type == parseTypes.OR || p.type == parseTypes.NOT || p.type == parseTypes.START || p.type == parseTypes.END || p.type == parseTypes.GROUP && p.children.every(function (c) {
	                return this.isPropositional(c);
	            });
	        }
	    }, {
	        key: "resetStream",
	        value: function resetStream() {
	            this.stream = { string: "", tokens: [], position: 0, errors: [] };
	        }
	    }, {
	        key: "charPosition",
	        value: function charPosition() {
	            return this.currentToken() ? this.currentToken().range.start : this.stream.string.length;
	        }
	    }, {
	        key: "remainder",
	        value: function remainder() {
	            var end = this.charPosition();
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
	            var tree = this.parseExpression(0);
	            var result = { tree: tree, errors: this.parseErrors, remainder: this.remainder() };
	            this.parseErrors = [];
	            this.resetStream();
	            return result;
	        }
	    }, {
	        key: "parseExpression",
	        value: function parseExpression(tightness) {
	            var token = this.currentToken();
	            var tokenDef = this.tokensByType[token.type];
	            var start = token.range.start;
	            console.log("parse token " + token.type);
	            this.advance();
	            var tree = tokenDef.startParse(this, token);
	            console.log("Parsed unit " + tree.type);
	            tree.range.start = start;
	            tree.range.end = this.charPosition();
	            if (tree.type == ERROR) {
	                return tree;
	            }
	            token = this.currentToken();
	            while (token && tightness < token.tightness) {
	                tokenDef = this.tokensByType[token.type];
	                this.advance();
	                console.log("Extend " + tree.type + " using " + token.type);
	                var newTree = tokenDef.extendParse(this, tree, token);
	                console.log("Got " + newTree.type);
	                newTree.range.start = tree.range.start;
	                newTree.range.end = this.charPosition();
	                if (newTree.type == ERROR) {
	                    return newTree;
	                }
	                tree = newTree;
	                token = this.currentToken();
	            }
	            return tree;
	        }
	    }]);
	
	    return Parser;
	})();
	
	exports.Parser = Parser;
	
	// A bit redundant, but makes defining generic startParse/extendParse functions easier.

/***/ }
/******/ ]);
//# sourceMappingURL=playspecs.js.map