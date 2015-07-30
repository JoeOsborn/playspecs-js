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
	    return isCustom(p) || p.type == parseTypes.AND || p.type == parseTypes.OR || p.type == parseTypes.NOT || p.type == parseTypes.TRUE || p.type == parseTypes.FALSE || p.type == parseTypes.START || p.type == parseTypes.END || p.type == parseTypes.GROUP && p.children.every(function (c) {
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
	
	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var _parser = __webpack_require__(1);
	
	var Compiler = (function () {
	    function Compiler(_ctx) {
	        _classCallCheck(this, Compiler);
	    }
	
	    _createClass(Compiler, [{
	        key: "compileTree",
	        value: function compileTree(tree, idx) {
	            //console.log(`compile ${tree.type} at index ${idx}`);
	            if (tree.type == _parser.parseTypes.GROUP) {
	                // TODO: submatch saving
	                return this.compileTree(tree.children[0], idx);
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
	            if (tree.type == _parser.parseTypes.INTERSECTION) {}
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
	            return [];
	        }
	    }, {
	        key: "compile",
	        value: function compile(tree) {
	            var debug = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
	
	            if (!tree.type && tree.tree && tree.errors && tree.remainder) {
	                throw new Error("Received a ParseResult, but expected a ParseTree." + "Call compile() with the .tree element of " + tree);
	            }
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
	            }, { type: "jump", target: 0, index: 2, source: "root" }, { type: "start", group: "$root", index: 3, source: "root" }];
	            var body = this.compileTree(tree, preface.length);
	            var result = preface.concat(body).concat([{
	                type: "end",
	                group: "$root",
	                index: preface.length + body.length,
	                source: "root"
	            }, {
	                type: "match",
	                index: preface.length + body.length + 1,
	                source: "root"
	            }]);
	            if (!this.validate(result)) {
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
	        key: "validate",
	        value: function validate(pgm) {
	            // todo: validate programs against some basic sanity checks.
	            //ensure each instruction's index is its index in pgm
	            //ensure no split or jump goes beyond end of program
	            //...
	            return true;
	        }
	    }, {
	        key: "stringifyCustom",
	        value: function stringifyCustom(formula) {
	            var _this = this;
	
	            var value = formula.value === undefined ? "" : formula.value.toString();
	            var children = formula.children && formula.children.length ? formula.children.map(function (c) {
	                return _this.stringifyFormula(c);
	            }).join(",") : "";
	            return formula.type + "(" + value + "," + children + ")";
	        }
	    }, {
	        key: "stringifyFormula",
	        value: function stringifyFormula(formula) {
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
	                    return this.stringifyFormula(formula.children[0]) + " & " + this.stringifyFormula(formula.children[1]);
	                case _parser.parseTypes.OR:
	                    return this.stringifyFormula(formula.children[0]) + " | " + this.stringifyFormula(formula.children[1]);
	                case _parser.parseTypes.NOT:
	                    return "not " + this.stringifyFormula(formula.children[0]);
	                case _parser.parseTypes.GROUP:
	                    return "(" + this.stringifyFormula(formula.children[0]) + ")";
	                default:
	                    return this.stringifyCustom(formula);
	            }
	        }
	    }, {
	        key: "stringify",
	        value: function stringify(code) {
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
	                        instrStr += " " + this.stringifyFormula(instr.formula);
	                        break;
	                    case "start":
	                    case "end":
	                        instrStr += " " + instr.group;
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
	                        if (instr.type == "check") {
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
	    }]);
	
	    return Compiler;
	})();
	
	exports["default"] = Compiler;
	module.exports = exports["default"];

	// TODO: intersection

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
	        if (a[i].type != b[i].type || a[i].index != b[i].index || a[i].target != b[i].target) {
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
	                        target: instr.group
	                    });
	                    thread.pc++;
	                    this.enqueueThread(thread);
	                    return;
	                case "end":
	                    thread.pushMatchInstruction({
	                        type: "end",
	                        // +1 for same reason as above.
	                        index: this.state.index + 1,
	                        target: instr.group
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
	                        var newG = { group: instr.target, start: instr.index, end: Infinity };
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
	                        var finishedG = liveGroups[instr.target];
	                        finishedG.end = instr.index;
	                        delete liveGroups[instr.target];
	                        break;
	                }
	            }
	            var openGroups = Object.getOwnPropertyNames(liveGroups);
	            if (openGroups.length) {
	                throw new Error("Open capture groups: " + openGroups.join(","));
	            }
	            var rootGroup = groups.shift();
	            var rootMatch = { start: rootGroup.start, end: rootGroup.end, subgroups: groups };
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
	    }]);
	
	    return PlayspecResult;
	})();

	module.exports = exports["default"];

/***/ }
/******/ ]);
//# sourceMappingURL=playspecs.js.map