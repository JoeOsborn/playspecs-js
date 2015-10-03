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
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }
	
	var _parser = __webpack_require__(1);
	
	var ParserExports = _interopRequireWildcard(_parser);
	
	var _compiler = __webpack_require__(2);
	
	var _compiler2 = _interopRequireDefault(_compiler);
	
	var _playspec = __webpack_require__(3);
	
	var _playspec2 = _interopRequireDefault(_playspec);
	
	var _sfa = __webpack_require__(4);
	
	var SFA = { SFA: _sfa.SFACls, fromParseTree: _sfa.fromParseTree, resetStateID: _sfa.resetStateID };
	exports.SFA = SFA;
	var Parser = ParserExports;
	exports.Parser = Parser;
	var Compiler = _compiler2["default"];
	exports.Compiler = Compiler;
	var Playspec = _playspec2["default"];
	exports.Playspec = Playspec;
	
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
	
	exports.cloneTree = cloneTree;
	exports.isCustom = isCustom;
	exports.isPropositional = isPropositional;
	
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
	    CAPTURING_LEFT_PAREN: "$(",
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
	    OMEGA: tokenTypes.DOTS_OMEGA,
	    REPETITION: tokenTypes.DOTS_GREEDY,
	    CONCATENATION: tokenTypes.CONCATENATION,
	    CAPTURE: "$(",
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
	
	function cloneTree(p) {
	    return {
	        type: p.type,
	        value: p.value,
	        children: p.children.slice(),
	        range: {
	            start: p.range.start,
	            end: p.range.end
	        }
	    };
	}
	
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
	    if (!isPropositional(left)) {
	        return parser.error("Left hand side of token must be propositional", token, left);
	    }
	    var children = [left];
	    var right = parser.parseExpression(token.tightness - 1);
	    if (!isPropositional(right)) {
	        return parser.error("Right hand side of token must be propositional", token, right);
	    }
	    children.push(right);
	    return parser.node(token.type, token.value, children);
	};
	
	exports.parseInfixRPropositional = parseInfixRPropositional;
	var BOUND_INFINITE = "$END";
	
	exports.BOUND_INFINITE = BOUND_INFINITE;
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
	        var truePhi = parser.node(parseTypes.TRUE, true);
	        truePhi.range.start = token.range.start;
	        truePhi.range.end = token.range.start;
	        return parser.node(parseTypes.REPETITION, token.value, [truePhi]);
	    },
	    extendParse: function extendParse(parser, left, token) {
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
	        var truePhi = parser.node(parseTypes.TRUE, true);
	        truePhi.range.start = token.range.start;
	        truePhi.range.end = token.range.start;
	        return parser.node(parseTypes.REPETITION, token.value, [truePhi]);
	    },
	    extendParse: function extendParse(parser, left, token) {
	        return parser.node(parseTypes.REPETITION, token.value, [left]);
	    }
	}, {
	    type: tokenTypes.DOTS_OMEGA,
	    match: [tokenTypes.DOTS_OMEGA],
	    tightness: 110,
	    startParse: function startParse(parser, token) {
	        var truePhi = parser.node(parseTypes.TRUE, true);
	        truePhi.range.start = token.range.start;
	        truePhi.range.end = token.range.end;
	        return parser.node(parseTypes.OMEGA, token.value, [truePhi]);
	    },
	    extendParse: function extendParse(parser, left, token) {
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
	        parser.advance();
	        return parser.node(parseTypes.GROUP, token.value, [expr]);
	    }
	}, {
	    type: tokenTypes.RIGHT_PAREN,
	    match: [tokenTypes.RIGHT_PAREN]
	}, {
	    type: tokenTypes.CAPTURING_LEFT_PAREN,
	    match: /^\$([A-z_][A-z_0-9]*)?\(/,
	    value: function value(matchResult) {
	        return {
	            group: matchResult[1] || "$implicit"
	        };
	    },
	    startParse: function startParse(parser, token) {
	        //parse an expression at RBP 0, then eat a )
	        var expr = parser.parseExpression(0);
	        if (parser.currentToken().type != tokenTypes.RIGHT_PAREN) {
	            return parser.error("Missing right parenthesis", token, expr);
	        }
	        parser.advance();
	        return parser.node(parseTypes.CAPTURE, token.value, [expr]);
	    }
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
	        if (!isPropositional(phi)) {
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
	
	function isCustom(p) {
	    for (var k in parseTypes) {
	        if (parseTypes[k] == p.type) {
	            return false;
	        }
	    }
	    return true;
	}
	
	function isPropositional(p) {
	    return isCustom(p) || p.type == parseTypes.AND || p.type == parseTypes.OR || p.type == parseTypes.NOT || p.type == parseTypes.TRUE || p.type == parseTypes.FALSE || p.type == parseTypes.START || p.type == parseTypes.END || (p.type == parseTypes.GROUP || p.type == parseTypes.CAPTURE) && p.children.every(function (c) {
	        return isPropositional(c);
	    });
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
	            this.advance();
	            var tree = tokenDef.startParse(this, token);
	            tree.range.start = start;
	            tree.range.end = this.charPosition();
	            if (tree.type == ERROR) {
	                return tree;
	            }
	            token = this.currentToken();
	            while (token && tightness < token.tightness) {
	                tokenDef = this.tokensByType[token.type];
	                this.advance();
	                var newTree = tokenDef.extendParse(this, tree, token);
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

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	exports.stringifyCustom = stringifyCustom;
	exports.stringifyFormula = stringifyFormula;
	exports.stringify = stringify;
	
	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var _parser = __webpack_require__(1);
	
	var _sfa = __webpack_require__(4);
	
	var DEBUG_MODE = false;
	
	var Compiler = (function () {
	    function Compiler(_ctx) {
	        _classCallCheck(this, Compiler);
	
	        this.captureIdx = 0;
	    }
	
	    _createClass(Compiler, [{
	        key: "compileTree",
	        value: function compileTree(tree, idx) {
	            //console.log(`compile ${tree.type} at index ${idx}`);
	            if (tree.type == _parser.parseTypes.GROUP) {
	                return this.compileTree(tree.children[0], idx);
	            }
	            if (tree.type == _parser.parseTypes.CAPTURE) {
	                var _captureID = this.captureIdx;
	                var _group = tree.value.group == "$implicit" ? _captureID : tree.value.group;
	                var start = { type: "start", group: _group, captureID: _captureID, index: idx, source: tree };
	                this.captureIdx++;
	                var children = this.compileTree(tree.children[0], idx + 1);
	                var end = {
	                    type: "end",
	                    group: _group,
	                    captureID: _captureID,
	                    index: idx + 1 + children.length,
	                    source: tree
	                };
	                return [start].concat(children).concat([end]);
	            }
	            if ((0, _parser.isPropositional)(tree)) {
	                //console.log("tree " + JSON.stringify(tree) + ":" + tree.type + " is propositional");
	                return [{ type: "check", formula: tree, index: idx, source: tree }];
	            }
	            if (tree.type == _parser.parseTypes.CONCATENATION) {
	                var aIdx = idx;
	                var a = this.compileTree(tree.children[0], aIdx);
	                var bIdx = idx + a.length;
	                var b = this.compileTree(tree.children[1], bIdx);
	                return a.concat(b);
	            }
	            if (tree.type == _parser.parseTypes.ALTERNATION) {
	                // branch; but need to compile left first.
	                // left:
	                var aIdx = idx + 1;
	                var _left = this.compileTree(tree.children[0], aIdx);
	                var bIdx = aIdx + _left.length + 1; // Leave room for jump after left
	                // now we can define branch, which goes before left:
	                var branch = [{ type: "split", left: aIdx, right: bIdx, index: idx, source: tree }];
	                // right:
	                var _right = this.compileTree(tree.children[1], bIdx);
	                var cIdx = bIdx + _right.length;
	                var jump = [{ type: "jump", target: cIdx, index: aIdx + _left.length, source: tree }];
	                return branch.concat(_left).concat(jump).concat(_right);
	            }
	            if (tree.type == _parser.parseTypes.INTERSECTION) {
	                var a = (0, _sfa.fromParseTree)(tree.children[0]);
	                var b = (0, _sfa.fromParseTree)(tree.children[1]);
	                var axb = a.intersect(b);
	                return this.compileSFA(axb, idx);
	            }
	            if (tree.type == _parser.parseTypes.REPETITION) {
	                var greedy = tree.value.greedy;
	                var min = tree.value.lowerBound;
	                var phi = tree.children[0];
	                // min repetitions of phi
	                var preface = [];
	                for (var i = 0; i < min; i++) {
	                    var phiPgm = this.compileTree(phi, idx);
	                    idx += phiPgm.length;
	                    preface.push.apply(preface, _toConsumableArray(phiPgm));
	                }
	                if (tree.value.upperBound != _parser.BOUND_INFINITE) {
	                    // M-N repetitions of (phi?)
	                    var max = tree.value.upperBound;
	                    var optionals = [];
	                    var targets = [];
	                    for (var i = min; i < max; i++) {
	                        // make room for split li,lZ
	                        idx = idx + 1;
	                        // store jump target li in targets
	                        targets.push(idx);
	                        var phiPgm = this.compileTree(phi, idx);
	                        // make room for phiPgm
	                        idx += phiPgm.length;
	                        optionals.push(phiPgm);
	                    }
	                    //idx is now just past the end of all the "optionals".
	                    var repetition = [];
	                    for (var i = 0; i < optionals.length; i++) {
	                        repetition.push({
	                            type: "split",
	                            left: greedy ? targets[i] : idx,
	                            right: greedy ? idx : targets[i],
	                            index: targets[i] - 1,
	                            source: tree
	                        });
	                        repetition.push.apply(repetition, _toConsumableArray(optionals[i]));
	                    }
	                    return preface.concat(repetition);
	                } else {
	                    // A: split B, C; but must compile B first to get label for C
	                    var aIdx = idx;
	                    // make room for the split
	                    var bIdx = aIdx + 1;
	                    // then put in B
	                    var b = this.compileTree(phi, bIdx);
	                    var jump = [{ type: "jump", target: aIdx, index: bIdx + b.length, source: tree }];
	                    // then label C
	                    var cIdx = bIdx + b.length + 1;
	                    var branch = [{
	                        type: "split",
	                        left: greedy ? bIdx : cIdx,
	                        right: greedy ? cIdx : bIdx,
	                        index: idx,
	                        source: tree
	                    }];
	                    return preface.concat(branch).concat(b).concat(jump);
	                }
	            }
	            throw new Error("Can't compile " + JSON.stringify(tree));
	        }
	    }, {
	        key: "compileSFA",
	        value: function compileSFA(sfa, idx) {
	            var stateStarts = {},
	                endJumps = [];
	            var pgm = [];
	            for (var i = 0; i < sfa.startStates.length; i++) {
	                var start = sfa.startStates[i];
	                var startPgm = this.compileSFA_(start, idx, stateStarts, endJumps);
	                pgm = pgm.concat(startPgm);
	                idx += startPgm.length;
	            }
	            for (var i = 0; i < endJumps.length; i++) {
	                endJumps[i].target = idx;
	            }
	            return pgm;
	        }
	    }, {
	        key: "compileSFA_",
	        value: function compileSFA_(state, idx, stateStarts, endJumps) {
	            if (state.id in stateStarts) {
	                return [{
	                    type: "jump",
	                    target: stateStarts[state.id],
	                    index: idx,
	                    source: { type: "state", value: state.id }
	                }];
	            }
	            stateStarts[state.id] = idx;
	            if (state.edges.length == 0) {
	                if (state.isAccepting) {
	                    var jump = {
	                        type: "jump",
	                        target: null,
	                        index: idx,
	                        source: { type: "state", value: state.id }
	                    };
	                    endJumps.push(jump);
	                    return [jump];
	                } else {
	                    throw new Error("Compiling an SFA state with no outgoing edges");
	                }
	            } else {
	                var pgm = [];
	                for (var i = 0; i < state.edges.length - 1; i++) {
	                    var _edge = state.edges[i];
	                    var edgeSplit = {
	                        type: "split",
	                        left: idx + 1,
	                        right: null,
	                        index: idx,
	                        source: { type: "state", value: state.id + "." + i }
	                    };
	                    var _edgePgm = [edgeSplit].concat(this.compileSFA_edge(state, _edge, idx + 1, stateStarts, endJumps));
	                    pgm = pgm.concat(_edgePgm);
	                    idx += _edgePgm.length;
	                    edgeSplit.right = idx;
	                }
	                var edge = state.edges[state.edges.length - 1];
	                var edgePgm = this.compileSFA_edge(state, edge, idx, stateStarts, endJumps);
	                return pgm.concat(edgePgm);
	            }
	        }
	    }, {
	        key: "compileSFA_edge",
	        value: function compileSFA_edge(state, edge, idx, stateStarts, endJumps) {
	            //accepting self-edges need to be treated specially so they don't jump right back
	            //to the parent state.
	            var edgePgm = this.compileSFA_edgeLabel(state, edge, idx);
	            idx += edgePgm.length;
	            if (state.isAccepting && edge.target == state && !edge.formula) {
	                var jump = {
	                    type: "jump",
	                    target: null,
	                    index: idx,
	                    source: { type: "edge", value: state.id + "->" + edge.target.id }
	                };
	                endJumps.push(jump);
	                return edgePgm.concat([jump]);
	            } else if (edge.formula) {
	                return edgePgm.concat([{
	                    type: "check",
	                    formula: edge.formula,
	                    index: idx,
	                    source: { type: "edge", value: state.id + "->" + edge.target.id }
	                }]).concat(this.compileSFA_(edge.target, idx + 1, stateStarts, endJumps));
	            } else {
	                return edgePgm.concat(this.compileSFA_(edge.target, idx, stateStarts, endJumps));
	            }
	        }
	    }, {
	        key: "compileSFA_edgeLabel",
	        value: function compileSFA_edgeLabel(state, edge, idx) {
	            var pgm = [];
	            for (var i = 0; i < edge.label.length; i++) {
	                var l = edge.label[i];
	                if (l.type == "start-capture") {
	                    var _captureID2 = this.captureIdx;
	                    var _group2 = l.group;
	                    l.captureID = _captureID2;
	                    var start = {
	                        type: "start",
	                        group: _group2,
	                        captureID: _captureID2,
	                        index: idx,
	                        source: { type: "edge", value: state.id + "->" + edge.target.id }
	                    };
	                    this.captureIdx++;
	                    pgm.push(start);
	                    idx++;
	                } else if (l.type == "end-capture") {
	                    var _captureID3 = l.start.captureID;
	                    var _group3 = l.group;
	                    var end = {
	                        type: "end",
	                        group: _group3,
	                        captureID: _captureID3,
	                        index: idx,
	                        source: { type: "edge", value: state.id + "->" + edge.target.id }
	                    };
	                    pgm.push(end);
	                    idx++;
	                }
	            }
	            return pgm;
	        }
	    }, {
	        key: "compile",
	        value: function compile(tree) {
	            var debug = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
	
	            if (!tree.type && tree.tree && tree.errors && tree.remainder) {
	                throw new Error("Received a ParseResult, but expected a ParseTree." + "Call compile() with the .tree element of " + tree);
	            }
	            if (!this.validateParseTree(tree)) {
	                throw new Error("Parse tree did not represent a valid program");
	            }
	            (0, _sfa.resetStateID)();
	            this.captureIdx = 0;
	            // We preface every program with "true .." so that all Playspecs are effectively start-anchored.
	            // This is as per https://swtch.com/~rsc/regexp/regexp2.html
	            var preface = [{ type: "split", left: 3, right: 1, index: 0, source: "root" }, {
	                type: "check",
	                formula: {
	                    type: _parser.parseTypes.TRUE,
	                    value: true,
	                    children: [],
	                    range: { start: 0, end: 0 }
	                },
	                index: 1,
	                source: "root"
	            }, { type: "jump", target: 0, index: 2, source: "root" }, { type: "start", group: "$root", captureID: -1, index: 3, source: "root" }];
	            var body = this.compileTree(tree, preface.length);
	            var result = preface.concat(body).concat([{
	                type: "end",
	                group: "$root",
	                captureID: -1,
	                index: preface.length + body.length,
	                source: "root"
	            }, {
	                type: "match",
	                index: preface.length + body.length + 1,
	                source: "root"
	            }]);
	            if (!this.validateProgram(result)) {
	                throw new Error("Error compiling tree " + JSON.stringify(tree) + " into result " + JSON.stringify(result));
	            }
	            if (!debug) {
	                for (var i = 0; i < result.length; i++) {
	                    delete result[i].source;
	                    delete result[i].index;
	                }
	            }
	            return result;
	        }
	    }, {
	        key: "validateParseTree",
	        value: function validateParseTree(parseTree) {
	            if (!DEBUG_MODE) {
	                return true;
	            }
	            // ensure no ${} underneath a proposition
	            if (this.anyCapturesInsidePropositions(parseTree)) {
	                return false;
	            }
	            // todo: other sanity checks
	            return true;
	        }
	    }, {
	        key: "anyCapturesInsidePropositions",
	        value: function anyCapturesInsidePropositions(parent) {
	            var prop = (0, _parser.isPropositional)(parent);
	            for (var ci = 0; ci < parent.children.length; ci++) {
	                var child = parent.children[ci];
	                if (prop && child.type == _parser.parseTypes.CAPTURE) {
	                    console.log("Can't put a capturing group inside of a propositional term: " + this.stringifyFormula(parent) + "!");
	                    return true;
	                }
	                if (this.anyCapturesInsidePropositions(child)) {
	                    return true;
	                }
	            }
	            return false;
	        }
	    }, {
	        key: "validateProgram",
	        value: function validateProgram(pgm) {
	            // todo: validate programs against more basic sanity checks.
	            //ensure each instruction's index is its index in pgm
	            //ensure no split or jump goes beyond end of program
	            //...
	            if (!DEBUG_MODE) {
	                return true;
	            }
	            for (var i = 0; i < pgm.length; i++) {
	                var instr = pgm[i];
	                //is its index correct?
	                if (instr.index !== i) {
	                    throw new Error("Bad code generation:" + instr.index + " != " + i + " for " + stringify([instr]) + " in " + stringify(pgm));
	                }
	            }
	            var reachable = this.reachableInstructions(pgm, 0, {});
	            for (var i = 0; i < pgm.length; i++) {
	                if (!reachable[i]) {
	                    throw new Error("Bad code generation:" + i + " not reachable for " + stringify([pgm[i]]) + " in " + stringify(pgm));
	                }
	            }
	            return true;
	        }
	    }, {
	        key: "reachableInstructions",
	        value: function reachableInstructions(pgm, i0, seen) {
	            //a loop, or else out of program code
	            if (i0 in seen || i0 >= pgm.length) {
	                return seen;
	            }
	            //mark i0 as seen
	            seen[i0] = true;
	            var other = pgm[i0];
	            //follow indirection via recursive search, keeping track of seen locations
	            if (other.type == "split") {
	                var seenLeft = this.reachableInstructions(pgm, other.left, seen);
	                return this.reachableInstructions(pgm, other.right, seenLeft);
	            } else if (other.type == "jump") {
	                return this.reachableInstructions(pgm, other.target, seen);
	            } else {
	                //for non-indirect instructions, just increment i0 and move on
	                return this.reachableInstructions(pgm, i0 + 1, seen);
	            }
	        }
	    }]);
	
	    return Compiler;
	})();
	
	exports["default"] = Compiler;
	
	function stringifyCustom(formula) {
	    var value = formula.value === undefined ? "" : formula.value.toString();
	    var children = formula.children && formula.children.length ? formula.children.map(function (c) {
	        return stringifyFormula(c);
	    }).join(",") : "";
	    return formula.type + "(" + value + "," + children + ")";
	}
	
	function stringifyFormula(formula) {
	    switch (formula.type) {
	        case _parser.parseTypes.TRUE:
	            return "true";
	        case _parser.parseTypes.FALSE:
	            return "false";
	        case _parser.parseTypes.START:
	            return "start";
	        case _parser.parseTypes.END:
	            return "end";
	        case _parser.parseTypes.AND:
	            return stringifyFormula(formula.children[0]) + " & " + stringifyFormula(formula.children[1]);
	        case _parser.parseTypes.OR:
	            return stringifyFormula(formula.children[0]) + " | " + stringifyFormula(formula.children[1]);
	        case _parser.parseTypes.NOT:
	            return "not " + stringifyFormula(formula.children[0]);
	        case _parser.parseTypes.GROUP:
	            return "(" + stringifyFormula(formula.children[0]) + ")";
	        case _parser.parseTypes.CAPTURE:
	            return "$" + formula.captureID + ":" + formula.group + "(" + stringifyFormula(formula.children[0]) + ")";
	        default:
	            return stringifyCustom(formula);
	    }
	}
	
	function stringify(code) {
	    var result = [];
	    for (var i = 0; i < code.length; i++) {
	        var instr = code[i];
	        var instrStr = i + ":" + instr.type;
	        switch (instr.type) {
	            case "split":
	                instrStr += " " + instr.left + " " + instr.right;
	                break;
	            case "jump":
	                instrStr += " " + instr.target;
	                break;
	            case "check":
	                instrStr += " " + stringifyFormula(instr.formula);
	                break;
	            case "start":
	            case "end":
	                instrStr += " " + instr.group + " (" + instr.captureID + ")";
	                break;
	            case "match":
	                break;
	            default:
	                throw new Error("Unrecognized instruction " + instr);
	        }
	        if (instr.source) {
	            if (instr.source == "root") {
	                instrStr += "  \t\t(root)";
	            } else {
	                if (instr.type == "check" && "range" in instr.source) {
	                    instrStr += "\t(ch. " + instr.source.range.start + "-" + instr.source.range.end + ")";
	                } else {
	                    instrStr += "\t\t(" + instr.source.type + " " + JSON.stringify(instr.source.value) + ")";
	                }
	            }
	        }
	        result.push(instrStr);
	    }
	    return result.join("\n");
	}
	
	Compiler.stringify = stringify;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var _parserJs = __webpack_require__(1);
	
	var _compilerJs = __webpack_require__(2);
	
	var _compilerJs2 = _interopRequireDefault(_compilerJs);
	
	var Playspec = (function () {
	    function Playspec(spec, context) {
	        var debug = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];
	
	        _classCallCheck(this, Playspec);
	
	        this.checkAPI = context.checks;
	        this.traceAPI = context.trace;
	        this.spec = spec;
	        var parser = new _parserJs.Parser(context);
	        var compiler = new _compilerJs2["default"](context);
	        this.parseResult = parser.parse(spec);
	        if (this.parseResult.errors.length) {
	            throw new Error("Parsed with errors:" + JSON.stringify(this.parseResult.errors));
	        }
	        this.program = compiler.compile(this.parseResult.tree, debug);
	    }
	
	    _createClass(Playspec, [{
	        key: "check",
	        value: function check(trace, state, idx, formula) {
	            switch (formula.type) {
	                case _parserJs.parseTypes.TRUE:
	                    return true;
	                case _parserJs.parseTypes.FALSE:
	                    return false;
	                case _parserJs.parseTypes.START:
	                    return idx == 0;
	                case _parserJs.parseTypes.END:
	                    return this.traceAPI.isAtEnd(trace);
	                case _parserJs.parseTypes.AND:
	                    return this.check(trace, state, idx, formula.children[0]) && this.check(trace, state, idx, formula.children[1]);
	                case _parserJs.parseTypes.OR:
	                    return this.check(trace, state, idx, formula.children[0]) || this.check(trace, state, idx, formula.children[1]);
	                case _parserJs.parseTypes.NOT:
	                    return !this.check(trace, state, idx, formula.children[0]);
	                case _parserJs.parseTypes.GROUP:
	                    return this.check(trace, state, idx, formula.children[0]);
	                default:
	                    if (this.checkAPI[formula.type]) {
	                        return this.checkAPI[formula.type](trace, state, idx, formula);
	                    } else {
	                        throw new Error("Unrecognized propositional formula");
	                    }
	            }
	        }
	    }, {
	        key: "match",
	        value: function match(trace) {
	            var preserveStates = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
	
	            return new PlayspecResult({
	                spec: this,
	                preserveStates: preserveStates
	            }, { trace: trace }, undefined).next();
	        }
	    }]);
	
	    return Playspec;
	})();
	
	exports["default"] = Playspec;
	
	var Thread = (function () {
	    function Thread(id, pc, priority, matches) {
	        _classCallCheck(this, Thread);
	
	        this.id = id;
	        this.pc = pc;
	        this.priority = priority;
	        //match sharing: instead set this.matches to matches and set sharedMatches to true
	        this.matches = matches.map(function (m) {
	            var m2 = cloneMatch(m);
	            m2.priority = Math.max(priority, m.priority);
	            return m2;
	        });
	    }
	
	    _createClass(Thread, [{
	        key: "equals",
	        value: function equals(t2) {
	            return this.pc == t2.pc;
	        }
	    }, {
	        key: "hash",
	        value: function hash() {
	            return this.pc;
	        }
	    }, {
	        key: "mergeThread",
	        value: function mergeThread(other) {
	            // Match sharing: if matches are shared, replace matches list with slice of matches list,
	            // and insert either clones of other's matches (if other is sharing matches) or other's matches directly
	            // Also update priority of new matches
	            for (var i = 0; i < other.matches.length; i++) {
	                var found = false;
	                for (var j = 0; j < this.matches.length; j++) {
	                    if (matchEquivFn(this.matches[j], other.matches[i])) {
	                        found = true;
	                        break;
	                    }
	                }
	                if (!found) {
	                    var match = cloneMatch(other.matches[i]);
	                    match.priority = Math.max(this.priority, this.matches[i].priority);
	                    this.matches.push(match);
	                }
	            }
	            // Merge any other state
	        }
	    }, {
	        key: "hasOpenMatch",
	        value: function hasOpenMatch() {
	            for (var i = 0; i < this.matches.length; i++) {
	                if (this.matches[i].instructions.length > 0) {
	                    return true;
	                }
	            }
	            return false;
	        }
	    }, {
	        key: "pushMatchInstruction",
	        value: function pushMatchInstruction(instr) {
	            // Match sharing: if matches are shared, replace matches list with a new list containing clones of matches
	            // Also update priority of matches
	            // And set sharedMatches to false
	            for (var i = 0; i < this.matches.length; i++) {
	                this.matches[i].instructions.push(instr);
	            }
	        }
	    }, {
	        key: "terminate",
	        value: function terminate() {
	            // Let matches, and thus kept states, be garbage collected
	            this.matches = null;
	        }
	    }]);
	
	    return Thread;
	})();
	
	var NonReplacingHashMap = (function () {
	    function NonReplacingHashMap(equivFn, hashFn) {
	        var bucketCount = arguments.length <= 2 || arguments[2] === undefined ? 1000 : arguments[2];
	
	        _classCallCheck(this, NonReplacingHashMap);
	
	        this.equiv = equivFn;
	        this.hash = hashFn;
	        this.coll = new Array(bucketCount);
	        this.length = 0;
	    }
	
	    _createClass(NonReplacingHashMap, [{
	        key: "bucketFind",
	        value: function bucketFind(bucket, obj) {
	            for (var i = 0; i < bucket.length; i++) {
	                if (this.equiv ? this.equiv(bucket[i].key, obj) : bucket[i].key == obj) {
	                    return bucket[i].val;
	                }
	            }
	            return undefined;
	        }
	    }, {
	        key: "push",
	
	        // If val is not provided, it defaults to true
	        // Unlike a regular map, this will NOT replace existing keys!
	        value: function push(obj) {
	            var val = arguments.length <= 1 || arguments[1] === undefined ? undefined : arguments[1];
	
	            if (!val) {
	                val = true;
	            }
	            var hashCode = this.hash ? this.hash(obj) % this.coll.length : obj;
	            var bucket = this.coll[hashCode];
	            if (!bucket) {
	                this.coll[hashCode] = [{ key: obj, val: val }];
	            } else {
	                if (this.bucketFind(bucket, obj) !== undefined) {
	                    return false;
	                } else {
	                    bucket.push({ key: obj, val: val });
	                }
	            }
	            this.length++;
	            return true;
	        }
	    }, {
	        key: "get",
	        value: function get(obj) {
	            if (this.length == 0) {
	                return undefined;
	            }
	            var hashCode = this.hash ? this.hash(obj) % this.coll.length : obj;
	            var bucket = this.coll[hashCode];
	            if (!bucket) {
	                return undefined;
	            }
	            return this.bucketFind(bucket, obj);
	        }
	    }, {
	        key: "clear",
	        value: function clear() {
	            for (var i = 0; i < this.coll.length; i++) {
	                //todo: generate less garbage?
	                this.coll[i] = null;
	            }
	            this.length = 0;
	        }
	    }, {
	        key: "contains",
	        value: function contains(obj) {
	            if (this.length == 0) {
	                return false;
	            }
	            var hashCode = this.hash ? this.hash(obj) % this.coll.length : obj;
	            var bucket = this.coll[hashCode];
	            if (!bucket) {
	                return false;
	            }
	            return this.bucketFind(bucket, obj) !== undefined;
	        }
	    }]);
	
	    return NonReplacingHashMap;
	})();
	
	function hashInt(h, int32) {
	    h += int32 | 0;
	    h += h << 10 | 0;
	    h ^= h >> 6 | 0;
	    h += int32 >> 8 | 0;
	    h += h << 10 | 0;
	    h ^= h >> 6 | 0;
	    h += int32 >> 16 | 0;
	    h += h << 10 | 0;
	    h ^= h >> 6 | 0;
	    h += int32 >> 24 | 0;
	    h += h << 10 | 0;
	    h ^= h >> 6 | 0;
	    return h;
	}
	function finalizeHash(h) {
	    h += h << 3 | 0;
	    h ^= h >> 11 | 0;
	    h += h << 15 | 0;
	    return h;
	}
	function hashNumbers() {
	    var h = 0;
	
	    for (var _len = arguments.length, numbers = Array(_len), _key = 0; _key < _len; _key++) {
	        numbers[_key] = arguments[_key];
	    }
	
	    for (var i = 0; i < numbers.length; i++) {
	        h = hashInt(h, numbers[i]);
	    }
	    return finalizeHash(h);
	}
	
	var matchEquivFn = function matchEquivFn(a, b) {
	    if (a.instructions.length != b.instructions.length) {
	        return false;
	    }
	    for (var i = 0; i < a.instructions.length; i++) {
	        if (a[i].type != b[i].type || a[i].index != b[i].index || a[i].group != b[i].group) {
	            return false;
	        }
	    }
	    return true;
	};
	var matchHashFn = function matchHashFn(a) {
	    return hashNumbers(a.instructions.length);
	};
	
	function cloneMatch(m) {
	    return {
	        priority: m.priority,
	        instructions: m.instructions.slice()
	    };
	}
	
	var NonShrinkingArray = (function () {
	    function NonShrinkingArray() {
	        _classCallCheck(this, NonShrinkingArray);
	
	        this.array = [];
	        this.length = 0;
	    }
	
	    _createClass(NonShrinkingArray, [{
	        key: "push",
	        value: function push(obj) {
	            this.array[this.length] = obj;
	            this.length++;
	        }
	    }, {
	        key: "clear",
	        value: function clear() {
	            this.length = 0;
	        }
	    }, {
	        key: "get",
	        value: function get(i) {
	            if (i < 0 || i >= this.length) {
	                return undefined;
	            }
	            return this.array[i];
	        }
	    }, {
	        key: "first",
	        get: function get() {
	            if (this.length == 0) {
	                return undefined;
	            }
	            return this.array[0];
	        }
	    }]);
	
	    return NonShrinkingArray;
	})();
	
	// We know a priori that the number of priority levels is relatively small
	
	var PriorityQueue = (function () {
	    function PriorityQueue(pfn, equivFn, hashFn) {
	        _classCallCheck(this, PriorityQueue);
	
	        this.queues = [];
	        this.priorityFunction = pfn;
	        this.length = 0;
	        if (equivFn || hashFn) {
	            this.members = new NonReplacingHashMap(equivFn, hashFn);
	        } else {
	            this.members = undefined;
	        }
	        this.clear();
	    }
	
	    _createClass(PriorityQueue, [{
	        key: "push",
	
	        // We also know a priori that duplicates will be detected externally if there is no equivFn/hashFn
	        value: function push(obj) {
	            var idx = this.priorityFunction(obj);
	            if (this.members) {
	                if (this.members.contains(obj)) {
	                    return false;
	                }
	                this.members.push(obj);
	            }
	            if (!(idx in this.queues)) {
	                this.queues[idx] = [obj];
	            } else {
	                this.queues[idx].push(obj);
	            }
	            if (idx < this.lowestPriority) {
	                this.lowestPriority = idx;
	            }
	            if (idx > this.highestPriority) {
	                this.highestPriority = idx;
	            }
	            this.length++;
	            return true;
	        }
	    }, {
	        key: "shift",
	        value: function shift() {
	            if (this.lowestPriority >= Infinity || this.length == 0) {
	                return null;
	            }
	            var q = this.queues[this.lowestPriority];
	            // Within a priority level, we want the _reverse_ order of addition
	            var result = q.pop();
	            if (q.length == 0) {
	                delete this.queues[this.lowestPriority];
	                if (this.highestPriority <= this.lowestPriority) {
	                    this.lowestPriority = Infinity;
	                    this.highestPriority = -Infinity;
	                } else {
	                    while (!this.queues[this.lowestPriority] && this.lowestPriority < this.highestPriority) {
	                        this.lowestPriority++;
	                    }
	                }
	            }
	            this.length--;
	            return result;
	        }
	    }, {
	        key: "clear",
	        value: function clear() {
	            //todo: generate less garbage
	            this.queues = [];
	            this.lowestPriority = Infinity;
	            this.highestPriority = -Infinity;
	            this.length = 0;
	            if (this.members) {
	                this.members.clear();
	            }
	        }
	    }, {
	        key: "first",
	        get: function get() {
	            if (this.length == 0) {
	                return undefined;
	            }
	            return this.queues[this.lowestPriority][0];
	        }
	    }]);
	
	    return PriorityQueue;
	})();
	
	var LIVESET_CLEAR_INTERVAL = 100;
	
	var PlayspecResult = (function () {
	    function PlayspecResult(config, state, match) {
	        _classCallCheck(this, PlayspecResult);
	
	        this.config = config;
	        this.state = state;
	        if (!this.state || !this.state.queue) {
	            this.state = {
	                // We can use plain arrays for the priority queue for now, since we know threads will be added
	                // in priority order. This also means we never shift, but increment i going up through the queue.
	                queue: new NonShrinkingArray(),
	                nextQueue: new NonShrinkingArray(),
	                // This NonReplacingHashMap will have number keys so it can use default hash/equiv
	                liveSet: new NonReplacingHashMap(null, null),
	                maxThreadID: 0,
	                // We start at -1 since the initial actions of the initial thread
	                // should happen before the trace reaches index 0. This mainly ensures that
	                // capture groups line up correctly.
	                index: -1,
	                pastEnd: false,
	                trace: this.config.spec.traceAPI.start(state.trace),
	                // Same here for matches, always added in priority order -- but can use a regular array
	                matchQueue: new PriorityQueue(function (m) {
	                    return m.priority;
	                }),
	                matchSet: new NonReplacingHashMap(matchEquivFn, matchHashFn),
	                lastMatchPriority: 0
	            };
	            var initThread = new Thread(0, 0, 0, [{ priority: 0, instructions: [] }]);
	            this.enqueueThread(initThread);
	            //swap queues
	            var temp = this.state.queue;
	            this.state.queue = this.state.nextQueue;
	            this.state.nextQueue = temp;
	            //clear live and match sets
	            this.state.liveSet.clear();
	            this.state.matchSet.clear();
	            //move index to start
	            this.state.index = 0;
	        }
	        this.match = match;
	    }
	
	    _createClass(PlayspecResult, [{
	        key: "hasReadyMatch",
	        value: function hasReadyMatch() {
	            if (!this.state.matchQueue.length) {
	                return false;
	            }
	            if (!this.state.queue.length) {
	                return true;
	            }
	            return this.state.matchQueue.first.priority <= this.state.queue.first.priority;
	        }
	    }, {
	        key: "enqueueThread",
	        value: function enqueueThread(thread) {
	            // Unlike Cox's implementation, we can only do duplicate checking for threads that are about to park.
	            // So we'll do some redundant jumping/splitting/matching, but since we need to merge threads it can't
	            // really be avoided.
	            var instr = this.config.spec.program[thread.pc];
	            switch (instr.type) {
	                case "jump":
	                    thread.pc = instr.target;
	                    this.enqueueThread(thread);
	                    return;
	                case "split":
	                    this.state.maxThreadID++;
	                    thread.pc = instr.left;
	                    //match sharing: Be sure thread1 knows thread2 is using its matches.
	                    //thread.sharedMatches = true;
	                    var thread2 = new Thread(this.state.maxThreadID, instr.right, thread.priority + 1, thread.matches);
	                    this.enqueueThread(thread);
	                    this.enqueueThread(thread2);
	                    return;
	                case "start":
	                    thread.pushMatchInstruction({
	                        type: "start",
	                        // +1 because the _current_ trace index just matched previously, so we don't want to include it in
	                        // the match that starts with the _next_ character.
	                        index: this.state.index + 1,
	                        group: instr.group,
	                        groupIndex: instr.captureID
	                    });
	                    thread.pc++;
	                    this.enqueueThread(thread);
	                    return;
	                case "end":
	                    thread.pushMatchInstruction({
	                        type: "end",
	                        // +1 for same reason as above.
	                        index: this.state.index + 1,
	                        group: instr.group,
	                        groupIndex: instr.captureID
	                    });
	                    thread.pc++;
	                    this.enqueueThread(thread);
	                    return;
	                case "match":
	                    // Add matches to queue
	                    for (var i = 0; i < thread.matches.length; i++) {
	                        if (thread.matches[i].priority >= thread.priority) {
	                            // If it's a novel match...
	                            if (this.state.matchSet.push(thread.matches[i])) {
	                                // Add it to the queue!
	                                this.state.matchQueue.push(thread.matches[i]);
	                            }
	                        }
	                    }
	                    //drop thread, its work is done
	                    thread.terminate();
	                    return;
	                case "check":
	                    // check live set, then add to queue
	                    var hash = thread.hash();
	                    var live = this.state.liveSet.get(hash);
	                    if (!live) {
	                        var threadList = new NonShrinkingArray();
	                        threadList.push(thread);
	                        this.state.liveSet.push(hash, { index: this.state.index, threads: threadList });
	                    } else if (live.index != this.state.index) {
	                        live.index = this.state.index;
	                        live.threads.clear();
	                        live.threads.push(thread);
	                    } else {
	                        //maybe present
	                        for (var i = 0; i < live.threads.length; i++) {
	                            if (live.threads.get(i).equals(thread)) {
	                                live.threads.get(i).mergeThread(thread);
	                                // Drop the merged-in thread, no more work to do
	                                thread.terminate();
	                                return;
	                            }
	                        }
	                    }
	                    //not present: add stuck thread to queue.
	                    this.state.nextQueue.push(thread);
	                    return;
	                //todo: case fork, join, joined-left, joined-right
	                // joined-left and joined-right will need to handle merging!
	                default:
	                    throw new Error("Unrecognized instruction type ${instr.type}");
	            }
	        }
	    }, {
	        key: "prettifyMatch",
	        value: function prettifyMatch(m) {
	            var groups = [];
	            var liveGroups = {};
	            for (var i = 0; i < m.instructions.length; i++) {
	                var instr = m.instructions[i];
	                switch (instr.type) {
	                    case "start":
	                        var newG = {
	                            group: instr.group,
	                            groupIndex: instr.groupIndex,
	                            start: instr.index,
	                            end: Infinity
	                        };
	                        if (this.config.preserveStates) {
	                            newG.states = [];
	                        }
	                        groups.push(newG);
	                        if (liveGroups[newG.group]) {
	                            throw new Error("Duplicate capture group");
	                        }
	                        liveGroups[newG.group] = newG;
	                        break;
	                    case "state":
	                        var openGroups = Object.getOwnPropertyNames(liveGroups);
	                        for (var gi = 0; gi < openGroups.length; gi++) {
	                            var continuedG = liveGroups[openGroups[gi]];
	                            continuedG.states.push(instr.state);
	                        }
	                        break;
	                    case "end":
	                        var finishedG = liveGroups[instr.group];
	                        finishedG.end = instr.index;
	                        delete liveGroups[instr.group];
	                        break;
	                }
	            }
	            var openGroups = Object.getOwnPropertyNames(liveGroups);
	            if (openGroups.length) {
	                throw new Error("Open capture groups: " + openGroups.join(","));
	            }
	            var rootGroup = groups.shift();
	            var rootMatch = {
	                start: rootGroup.start,
	                end: rootGroup.end,
	                //TODO: Ought empty captures to be dropped?
	                subgroups: groups.filter(function (group) {
	                    return group.start != group.end;
	                })
	            };
	            if (this.config.preserveStates) {
	                rootMatch.states = rootGroup.states;
	            }
	            return rootMatch;
	        }
	    }, {
	        key: "next",
	        value: function next() {
	            if (!this.state) {
	                throw new Error("Don't call next() on the same PlayspecResult twice!");
	            }
	            while (!this.hasReadyMatch() && this.state.queue.length) {
	                var _state = this.config.spec.traceAPI.currentState(this.state.trace);
	                var copiedState = undefined;
	                var limit = this.state.queue.length;
	                var lastPriority = 0;
	                for (var t = 0; t < this.state.queue.length; t++) {
	                    if (t >= limit) {
	                        throw new Error("The thread queue should never grow during a single trace state!");
	                    }
	                    if (t.priority < lastPriority) {
	                        throw new Error("Decreasing priority!");
	                    }
	                    var thread = this.state.queue.get(t);
	                    var instr = this.config.spec.program[thread.pc];
	                    switch (instr.type) {
	                        case "check":
	                            var checkResult = this.config.spec.check(this.state.trace, _state, this.state.index, instr.formula);
	                            if (checkResult) {
	                                thread.pc++;
	                                if (thread.hasOpenMatch) {
	                                    if (this.config.preserveStates) {
	                                        if (!copiedState) {
	                                            copiedState = this.config.spec.traceAPI.copyCurrentState ? this.config.spec.traceAPI.copyCurrentState() : _state;
	                                        }
	                                        thread.pushMatchInstruction({
	                                            type: "state",
	                                            index: this.state.index,
	                                            state: copiedState
	                                        });
	                                    }
	                                }
	                                this.enqueueThread(thread);
	                            } else {
	                                //otherwise drop the thread on the floor
	                                thread.terminate();
	                            }
	                            break;
	                        default:
	                            throw new Error("Thread should be parked on a check.");
	                    }
	                }
	                //swap queues and clear old queue
	                var temp = this.state.queue;
	                this.state.queue = this.state.nextQueue;
	                temp.clear();
	                this.state.nextQueue = temp;
	                //maybe clear liveset (don't want to do it every time, so short specs/strings can avoid memory churn)
	                if (this.state.index % LIVESET_CLEAR_INTERVAL == 0) {
	                    this.state.liveSet.clear();
	                }
	                //definitely clear matchset (later matches won't ever be equivalent to matches from this time)
	                this.state.matchSet.clear();
	                //advance, unless already at end
	                if (this.config.spec.traceAPI.isAtEnd(this.state.trace)) {
	                    //wipe out queue, no more trace to match!
	                    this.state.queue.clear();
	                    break;
	                }
	                this.config.spec.traceAPI.advanceState(this.state.trace);
	                this.state.index++;
	            }
	            if (this.hasReadyMatch()) {
	                // Also removes first match from queue!
	                var match = this.state.matchQueue.shift();
	                if (this.state.lastMatchPriority > match.priority) {
	                    throw new Error("Matches popped out of order!");
	                }
	                this.state.lastMatchPriority = match.priority;
	                var prettyMatch = this.prettifyMatch(match);
	                var nextState = this.state;
	                this.state = undefined;
	                return new PlayspecResult(this.config, nextState, prettyMatch);
	            } // Otherwise, we're out of queue or trace and have nowhere to go
	            this.state = undefined;
	            return null;
	        }
	    }, {
	        key: "start",
	        get: function get() {
	            return this.match ? this.match.start : -1;
	        }
	    }, {
	        key: "end",
	        get: function get() {
	            return this.match ? this.match.end : -1;
	        }
	    }, {
	        key: "states",
	        get: function get() {
	            return this.match ? this.match.states : undefined;
	        }
	    }, {
	        key: "subgroups",
	        get: function get() {
	            return this.match ? this.match.subgroups : undefined;
	        }
	    }]);
	
	    return PlayspecResult;
	})();

	module.exports = exports["default"];

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	
	var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	exports.resetStateID = resetStateID;
	exports.fromParseTree = fromParseTree;
	
	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }
	
	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var _parser = __webpack_require__(1);
	
	var _compiler = __webpack_require__(2);
	
	var stateID = 0;
	
	function resetStateID() {
	    stateID = 0;
	}
	
	var SFA = (function () {
	    function SFA() {
	        _classCallCheck(this, SFA);
	
	        this.startStates = [new State()];
	        this.acceptingStates = [];
	    }
	
	    _createClass(SFA, [{
	        key: "newState",
	        value: function newState(optID) {
	            return new State(optID);
	        }
	    }, {
	        key: "markAccepting",
	        value: function markAccepting(s) {
	            //add to acceptingStates
	            if (this.acceptingStates.indexOf(s) == -1) {
	                this.acceptingStates.push(s);
	            }
	            //add accepting self-edge
	            s.addEdge(new Edge(s, null, []));
	            //mark accepting
	            s.isAccepting = true;
	        }
	    }, {
	        key: "markNonAccepting",
	        value: function markNonAccepting(s) {
	            //mark non-accepting
	            s.isAccepting = false;
	            if (this.acceptingStates.indexOf(s) != -1) {
	                //remove from acceptingStates
	                s.acceptingStates.splice(s.acceptingStates.indexOf(s), 1);
	            }
	        }
	    }, {
	        key: "getStates",
	        value: function getStates() {
	            var found = {};
	            var stack = this.startStates.slice();
	            while (stack.length) {
	                var here = stack.pop();
	                found[here.id] = here;
	                for (var ek in here.edges) {
	                    var e = here.edges[ek];
	                    if (e.target && !(e.target.id in found)) {
	                        stack.push(e.target);
	                    }
	                }
	            }
	            return Object.keys(found).map(function (k) {
	                return found[k];
	            });
	        }
	    }, {
	        key: "toDot",
	        value: function toDot() {
	            var start = "digraph g {\n" + "  rankdir=LR;\n";
	            var middle = this.getStates().map(function (s) {
	                return ["  " + s.id + (" [shape=" + (s.isAccepting ? "doublecircle" : "circle") + "];")].concat(s.edges.map(function (e, i) {
	                    return "  " + s.id + "->" + e.target.id + (" [label=\"" + i + ":" + (e.formula ? (0, _compiler.stringifyFormula)(e.formula) : "&#949;") + ":" + e.label.map(function (l) {
	                        return l.type + "." + l.group;
	                    }).join(",") + "\"];");
	                })).join("\n");
	            }).join("\n");
	            var end = "\n}";
	            return start + middle + end;
	        }
	    }, {
	        key: "eelim",
	        value: function eelim() {
	            var _this = this;
	
	            var stack = this.startStates.slice(),
	                seen = {};
	            for (var sk = 0; sk < stack.length; sk++) {
	                seen[stack[sk].id] = stack[sk];
	            }
	
	            var _loop = function () {
	                var s = stack.pop();
	                var reachable = _defineProperty({}, s.id, s);
	
	                var _loop2 = function (_i) {
	                    var e = s.edges[_i];
	                    //e is a null transition but not an accepting null transition
	                    if (!e.formula && !(s.isAccepting && e.target == s)) {
	                        if (e.target.id in reachable) {
	                            s.edges.splice(_i, 1);
	                            _i--;
	                            return "continue";
	                        } else {
	                            var _s$edges;
	
	                            var targetEs = e.target.edges;
	                            var newEs = targetEs.map(function (te) {
	                                return new Edge(te.target == e.target && te.formula == null ? s : te.target, te.formula, e.label.concat(te.label));
	                            });
	                            if (e.target.isAccepting && !s.isAccepting) {
	                                _this.acceptingStates.push(s);
	                                s.isAccepting = true;
	                            }
	                            (_s$edges = s.edges).splice.apply(_s$edges, [_i, 1].concat(_toConsumableArray(newEs)));
	                        }
	                    }
	                    reachable[e.target.id] = e.target;
	                    i = _i;
	                };
	
	                for (var i = 0; i < s.edges.length; i++) {
	                    var _ret2 = _loop2(i);
	
	                    if (_ret2 === "continue") continue;
	                }
	                for (var rk in reachable) {
	                    if (!(rk in seen)) {
	                        stack.push(reachable[rk]);
	                        seen[rk] = reachable[rk];
	                    }
	                }
	            };
	
	            while (stack.length) {
	                _loop();
	            }
	            return this;
	        }
	    }, {
	        key: "intersect",
	        value: function intersect(b) {
	            this.eelim();
	            var a = this;
	            b.eelim();
	            var axb = new SFA();
	            axb.startStates = [];
	            var stack = [],
	                states = {};
	            for (var _i2 = 0; _i2 < a.startStates.length; _i2++) {
	                var sa = a.startStates[_i2];
	                for (var j = 0; j < b.startStates.length; j++) {
	                    var sb = b.startStates[j];
	                    stack.push([sa, sb]);
	                    if (!(sa.id in states)) {
	                        states[sa.id] = {};
	                    }
	                    var sasb = axb.newState("a" + sa.id + "x" + sb.id + "b");
	                    axb.startStates.push(sasb);
	                    states[sa.id][sb.id] = sasb;
	                    if (sa.isAccepting && sb.isAccepting) {
	                        axb.markAccepting(sasb);
	                    }
	                }
	            }
	            while (stack.length) {
	                var _stack$pop = stack.pop();
	
	                var _stack$pop2 = _slicedToArray(_stack$pop, 2);
	
	                var sa = _stack$pop2[0];
	                var sb = _stack$pop2[1];
	
	                var sab = states[sa.id][sb.id];
	                for (var _i3 = 0; _i3 < sa.edges.length; _i3++) {
	                    var ae = sa.edges[_i3];
	                    var aet = ae.target;
	                    var aeIsAcceptingSelfEdge = sa.isAccepting && aet == sa && !ae.formula;
	                    for (var j = 0; j < sb.edges.length; j++) {
	                        var be = sb.edges[j];
	                        var bet = be.target;
	                        var beIsAcceptingSelfEdge = sb.isAccepting && bet == sb && !be.formula;
	                        var phi = null;
	                        if (aeIsAcceptingSelfEdge != beIsAcceptingSelfEdge) {
	                            continue;
	                        } else if (!aeIsAcceptingSelfEdge) {
	                            if (!ae.formula || !be.formula) {
	                                console.error("Uneliminated non ASE epsilon transition");
	                            }
	                            phi = intersectFormulae(ae.formula, be.formula);
	                            if (!phi) {
	                                continue;
	                            }
	                        }
	                        var combined = null;
	                        if (aet.id in states && bet.id in states[aet.id]) {
	                            combined = states[aet.id][bet.id];
	                        } else {
	                            combined = axb.newState("a" + aet.id + "x" + bet.id + "b");
	                            if (!(aet.id in states)) {
	                                states[aet.id] = {};
	                            }
	                            states[aet.id][bet.id] = combined;
	                            stack.push([aet, bet]);
	                            if (aet.isAccepting && bet.isAccepting) {
	                                //no need for markaccepting or to check membership of combined.
	                                //former because we'll get the accepting self edges for free
	                                //latter because this state is by definition new
	                                combined.isAccepting = true;
	                                axb.acceptingStates.push(combined);
	                            }
	                        }
	                        sab.addEdge(new Edge(combined, phi, ae.label.concat(be.label)));
	                    }
	                }
	            }
	            return axb;
	        }
	    }]);
	
	    return SFA;
	})();
	
	exports.SFA = SFA;
	
	function intersectFormulae(p1, p2) {
	    //todo: fixme: implement for real
	    return { type: _parser.parseTypes.AND, value: "&", children: [p1, p2], range: { start: -1, end: -1 } };
	}
	
	var State = (function () {
	    function State(id) {
	        _classCallCheck(this, State);
	
	        this.id = id || stateID++;
	        this.edges = [];
	        this.isAccepting = false;
	    }
	
	    _createClass(State, [{
	        key: "addEdge",
	        value: function addEdge(e) {
	            this.edges.push(e);
	        }
	    }, {
	        key: "removeEdge",
	        value: function removeEdge(e) {
	            this.edges.splice(this.edges.indexOf(e), 1);
	        }
	    }]);
	
	    return State;
	})();
	
	var Edge = function Edge(target, formula, label) {
	    _classCallCheck(this, Edge);
	
	    this.target = target;
	    this.formula = formula;
	    this.label = label;
	};
	
	function fromParseTree(tree) {
	    var sfa = new SFA();
	    var s = sfa.startStates[0];
	    var outEdges = build(sfa, s, tree);
	    var terminus = sfa.newState();
	    for (var ek = 0; ek < outEdges.length; ek++) {
	        var e = outEdges[ek];
	        e.target = terminus;
	    }
	    sfa.markAccepting(terminus);
	    return sfa;
	}
	
	function build(_x, _x2, _x3) {
	    var _again = true;
	
	    _function: while (_again) {
	        var sfa = _x,
	            seedState = _x2,
	            tree = _x3;
	        e = aes = s = ek = e = greedy = min = max = phi = cloned = next = cloned = next = edges = out = edges = out = edges = ek = _e = e = e = edges = ek = _e2 = s = es = s = captureStart = es = ek = e = a = b = aes = bes = a = b = axb = oldAccepting = startk = outEdges = acck = acc = ei = undefined;
	        _again = false;
	
	        if ((0, _parser.isPropositional)(tree) && tree.type != _parser.parseTypes.CAPTURE) {
	            var e = new Edge(null, tree, []);
	            seedState.addEdge(e);
	            return [e];
	        } else if (tree.type == _parser.parseTypes.CONCATENATION) {
	            var aes = build(sfa, seedState, tree.children[0]);
	            var s = sfa.newState();
	            for (var ek = 0; ek < aes.length; ek++) {
	                var e = aes[ek];
	                e.target = s;
	            }
	            _x = sfa;
	            _x2 = s;
	            _x3 = tree.children[1];
	            _again = true;
	            continue _function;
	        } else if (tree.type == _parser.parseTypes.REPETITION) {
	            var greedy = tree.value.greedy;
	            var min = tree.value.lowerBound;
	            var max = tree.value.upperBound;
	            var phi = tree.children[0];
	            if (min > 0) {
	                var cloned = (0, _parser.cloneTree)(tree);
	                cloned.value.lowerBound--;
	                if (cloned.value.upperBound != "$END") {
	                    cloned.value.upperBound--;
	                }
	                var next = {
	                    type: _parser.parseTypes.CONCATENATION,
	                    value: ",",
	                    children: [(0, _parser.cloneTree)(phi), cloned],
	                    range: { start: cloned.start, end: cloned.end }
	                };
	                _x = sfa;
	                _x2 = seedState;
	                _x3 = next;
	                _again = true;
	                continue _function;
	            } else if (max != "$END") {
	                var cloned = (0, _parser.cloneTree)(tree);
	                cloned.value.upperBound--;
	                var next = {
	                    type: _parser.parseTypes.CONCATENATION,
	                    value: ",",
	                    children: [(0, _parser.cloneTree)(phi), cloned],
	                    range: { start: cloned.start, end: cloned.end }
	                };
	                //Lots of duplication here when only orderings are changed. Not so proud of it
	                //but let's just make sure it's working first.
	                if (greedy) {
	                    var edges = [];
	                    if (max == 0) {
	                        edges = edges.concat([new Edge(null, phi, [])]);
	                    } else {
	                        edges = edges.concat(build(sfa, seedState, next));
	                    }
	                    var out = new Edge(null, null, []);
	                    seedState.addEdge(out);
	                    edges.push(out);
	                    return edges;
	                } else {
	                    var edges = [];
	                    var out = new Edge(null, null, []);
	                    seedState.addEdge(out);
	                    edges.push(out);
	                    if (max == 1) {
	                        edges = edges.concat([new Edge(null, phi, [])]);
	                    } else {
	                        edges = edges.concat(build(sfa, seedState, next));
	                    }
	                    return edges;
	                }
	            } else {
	                if (greedy) {
	                    var edges = build(sfa, seedState, phi);
	                    for (var ek = 0; ek < edges.length; ek++) {
	                        var _e = edges[ek];
	                        _e.target = seedState;
	                    }
	                    var e = new Edge(null, null, []);
	                    seedState.addEdge(e);
	                    return [e];
	                } else {
	                    var e = new Edge(null, null, []);
	                    seedState.addEdge(e);
	                    var edges = build(sfa, seedState, phi);
	                    for (var ek = 0; ek < edges.length; ek++) {
	                        var _e2 = edges[ek];
	                        _e2.target = seedState;
	                    }
	                    return [e];
	                }
	            }
	        } else if (tree.type == _parser.parseTypes.GROUP) {
	            var s = sfa.newState();
	            seedState.addEdge(new Edge(s, null, []));
	            var es = build(sfa, s, tree.children[0]);
	            return es;
	        } else if (tree.type == _parser.parseTypes.CAPTURE) {
	            var s = sfa.newState();
	            //hack: we store a link from the end to its corresponding start
	            //so that the correct captureID can be propagated to the "end"
	            //from the "start" during compilation
	            var captureStart = { type: "start-capture", group: tree.value.group == "$implicit" ? s.id : tree.value.group };
	            seedState.addEdge(new Edge(s, null, [captureStart]));
	            var es = build(sfa, s, tree.children[0]);
	            for (var ek = 0; ek < es.length; ek++) {
	                var e = es[ek];
	                e.label.push({
	                    type: "end-capture",
	                    group: tree.value.group == "$implicit" ? s.id : tree.value.group,
	                    start: captureStart
	                });
	            }
	            return es;
	        } else if (tree.type == _parser.parseTypes.ALTERNATION) {
	            var a = sfa.newState();
	            var b = sfa.newState();
	            seedState.addEdge(new Edge(a, null, []));
	            seedState.addEdge(new Edge(b, null, []));
	            var aes = build(sfa, a, tree.children[0]);
	            var bes = build(sfa, b, tree.children[1]);
	            return aes.concat(bes);
	        } else if (tree.type == _parser.parseTypes.INTERSECTION) {
	            var a = fromParseTree(tree.children[0]);
	            var b = fromParseTree(tree.children[1]);
	            var axb = a.intersect(b);
	            var oldAccepting = axb.acceptingStates.slice();
	            //console.log("Supposed accepting:", oldAccepting, "actual",
	            //    axb.getStates().filter((s) => s.isAccepting)
	            //);
	            for (var startk = 0; startk < axb.startStates.length; startk++) {
	                seedState.addEdge(new Edge(axb.startStates[startk], null, []));
	            }
	            var outEdges = [];
	            for (var acck = 0; acck < oldAccepting.length; acck++) {
	                var acc = oldAccepting[acck];
	                sfa.markNonAccepting(acc);
	                //find the self-edge and repoint it towards nothing, including it in outEdges
	                for (var ei = 0; ei < acc.edges.length; ei++) {
	                    if (acc.edges[ei].target == acc && !acc.edges[ei].formula) {
	                        acc.edges[ei].target = null;
	                        outEdges.push(acc.edges[ei]);
	                    }
	                }
	            }
	
	            //console.log("POST supposed accepting:", sfa.acceptingStates, "actual",
	            //    sfa.getStates().filter((s) => s.isAccepting)
	            //);
	
	            return outEdges;
	        } else {
	            throw "Not yet implemented";
	        }
	    }
	}

/***/ }
/******/ ]);
//# sourceMappingURL=playspecs.js.map