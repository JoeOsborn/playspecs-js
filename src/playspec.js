/* @flow */

import {parseTypes, Parser} from "./parser.js";
import Compiler from "./compiler.js";

export default class Playspec {
    constructor(spec:string, context, debug:boolean=false) {
        this.checkAPI = context.checks;
        this.traceAPI = context.trace;
        this.spec = spec;
        const parser = new Parser(context);
        const compiler = new Compiler(context);
        this.parseResult = parser.parse(spec);
        this.program = compiler.compile(this.parseResult.tree, debug);
    }
    check(trace:Trace<State>, state:State, idx:number, formula:ParseTree):Boolean {
        switch (formula.type) {
            case parseTypes.TRUE:
                return true;
            case parseTypes.FALSE:
                return false;
            case parseTypes.START:
                return idx == 0;
            case parseTypes.END:
                return this.traceAPI.isAtEnd(trace);
            case parseTypes.AND:
                return this.check(trace, state, idx, formula.children[0]) &&
                    this.check(trace, state, idx, formula.children[1]);
            case parseTypes.OR:
                return this.check(trace, state, idx, formula.children[0]) ||
                    this.check(trace, state, idx, formula.children[1]);
            case parseTypes.NOT:
                return !this.check(trace, state, idx, formula.children[0]);
            case parseTypes.GROUP:
                return this.check(trace, state, idx, formula.children[0]);
            default:
                if(this.checkAPI[formula.type]) {
                    return this.checkAPI[formula.type](trace, state, idx, formula);
                } else {
                    throw new Error("Unrecognized propositional formula", trace, state, formula);
                }
        }
    }
    match(trace:Trace<State>, preserveStates:boolean=false):PlayspecResult {
        return (new PlayspecResult({
            spec:this,
            trace,
            preserveStates
        }, "$first")).next();
    }
}

class PlayspecResult {
    constructor(config:{spec:Playspec, trace:Trace<State>, preserveStates:boolean}, match:PlayspecMatchResult) {
        this.config = config;
        if(match != "$first") {
            this.start = match.start;
            this.end = match.end;
            this.states = match.states;
        } else {
            this.start = "$first";
            this.end = "$first";
            this.states = this.config.preserveStates ? [] : null;
        }
    }
    next():PlayspecResult {
        //return new PlayspecResult(
        // this.config,
        // {start:blah, end:blah, states:this.config.preserveStates ? blah : undefined}
        // );
        return this;
    }
}