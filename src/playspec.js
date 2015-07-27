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
        }, undefined, undefined)).next();
    }
}

class Thread {
    constructor(id:number, pc:number, priority:number) {
        this.id = id;
        this.pc = pc;
        this.priority = priority;
    }
}

class PlayspecResult {
    constructor(
        config:{spec:Playspec, trace:Trace<State>, preserveStates:boolean},
        state:{threads:Array<Thread>, maxThreadID:number},
        match:PlayspecMatchResult
    ) {
        this.config = config;
        this.state = state;
        if(!this.state) {
            this.state = {
                threads:[new Thread(0,0,0)],
                maxThreadID:0
            };
        }
        this.match = match;
        if(this.match) {
            this.start = match.start;
            this.end = match.end;
            this.states = match.states;
        } else {
            this.start = -1;
            this.end = -1;
            this.states = this.config.preserveStates ? [] : null;
        }
    }
    next():PlayspecResult {
        if(!this.state) {
            throw new Error("Don't call next() on the same PlayspecResult twice!", this);
        }
        // todo: ... interpret ...
        const result = new PlayspecResult(
            this.config,
            this.state,
            {start:0, end:0, states:this.config.preserveStates ? [] : undefined}
        );
        this.state = undefined;
        return result;
    }
}