/* @flow */

//const Parser = require("parser.js").Parser;
//
//var p = new Parser();
//
//console.log(p);
//
//export Parser;

import * as Parser from "./parser";
import * as Compiler from "./compiler";

exports.Parser = Parser;
exports.Compiler = Compiler;