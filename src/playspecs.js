/* @flow */

//const Parser = require("parser.js").Parser;
//
//var p = new Parser();
//
//console.log(p);
//
//export Parser;

import Parser from "./parser";

export function hi() {
    console.log("hello there");
}

exports.Parser = Parser;