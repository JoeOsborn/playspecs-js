/* @flow */

//const Parser = require("parser.js").Parser;
//
//var p = new Parser();
//
//console.log(p);
//
//export Parser;

import * as ParserExports from "./parser";
import {default as CompilerExports} from "./compiler";
import {default as PlayspecExports} from "./playspec";
import {SFACls, fromParseTree, resetStateID} from "./sfa";

export const SFA = {SFA:SFACls, fromParseTree:fromParseTree, resetStateID:resetStateID};
export const Parser = ParserExports;
export const Compiler = CompilerExports;
export const Playspec = PlayspecExports;