import { parseTypes, isPropositional, BOUND_INFINITE } from "./parser";
import { fromParseTree, resetStateID, SFA, State, Edge } from "./sfa";
import { TokenDefinition, ParseTree } from "./types";
type Jump = { type: "jump", target: number | null, index?: number, source?: "root" | ParseTree };
type Split = { type: "split", left: number, right: number | null, index?: number, source?: "root" | ParseTree };
type Start = { type: "start", group: string | number, captureID: number, index?: number, source?: "root" | ParseTree };
type Match = { type: "match", index?: number, source?: "root" | ParseTree };
type End = { type: "end", group: string | number, captureID: number, index?: number, source?: "root" | ParseTree };
type Check = { type: "check", formula: ParseTree, index?: number, source?: "root" | ParseTree };
type Instruction =
    Check |
    Jump |
    Split |
    Match |
    Start |
    End;
export type Program = Array<Instruction>;

const DEBUG_MODE = false;

export class Compiler {
    captureIdx: number;
    constructor(_tokenDefs: Array<TokenDefinition>) {
        this.captureIdx = 0;
    }

    compileTree(tree: ParseTree, idx: number): Program {
        //console.log(`compile ${tree.type} at index ${idx}`);
        if (tree.type == parseTypes.GROUP) {
            return this.compileTree(tree.children[0], idx);
        }
        if (tree.type == parseTypes.CAPTURE) {
            const captureID = this.captureIdx;
            const group = tree.value.group == "$implicit" ? captureID : tree.value.group;
            const start = { type: "start", group: group, captureID: captureID, index: idx, source: tree };
            this.captureIdx++;
            const children: Array<Instruction> = this.compileTree(tree.children[0], idx + 1);
            const end = {
                type: "end",
                group: group,
                captureID: captureID,
                index: idx + 1 + children.length,
                source: tree
            };
            return ([start] as Program).concat(children).concat([end] as Program);
        }
        if (isPropositional(tree)) {
            //console.log("tree " + JSON.stringify(tree) + ":" + tree.type + " is propositional");
            return [{ type: "check", formula: tree, index: idx, source: tree }];
        }
        if (tree.type == parseTypes.CONCATENATION) {
            const aIdx = idx;
            const a = this.compileTree(tree.children[0], aIdx);
            const bIdx = idx + a.length;
            const b = this.compileTree(tree.children[1], bIdx);
            return a.concat(b);
        }
        if (tree.type == parseTypes.ALTERNATION) {
            // branch; but need to compile left first.
            // left:
            const aIdx = idx + 1;
            const left = this.compileTree(tree.children[0], aIdx);
            const bIdx = aIdx + left.length + 1; // Leave room for jump after left
            // now we can define branch, which goes before left:
            const branch: Program = [{ type: "split", left: aIdx, right: bIdx, index: idx, source: tree }];
            // right:
            const right = this.compileTree(tree.children[1], bIdx);
            const cIdx = bIdx + right.length;
            const jump: Program = [{ type: "jump", target: cIdx, index: aIdx + left.length, source: tree }];
            return branch.concat(left).concat(jump).concat(right);
        }
        if (tree.type == parseTypes.INTERSECTION) {
            const a = fromParseTree(tree.children[0]);
            const b = fromParseTree(tree.children[1]);
            const axb = a.intersect(b);
            return this.compileSFA(axb, idx);
        }
        if (tree.type == parseTypes.REPETITION) {
            const greedy = tree.value.greedy;
            const min = tree.value.lowerBound;
            const phi = tree.children[0];
            // min repetitions of phi
            let preface = [];
            for (let i = 0; i < min; i++) {
                const phiPgm = this.compileTree(phi, idx);
                idx += phiPgm.length;
                preface.push(...phiPgm);
            }
            if (tree.value.upperBound != BOUND_INFINITE) {
                // M-N repetitions of (phi?)
                const max = tree.value.upperBound;
                let optionals = [];
                let targets = [];
                for (let i = min; i < max; i++) {
                    // make room for split li,lZ
                    idx = idx + 1;
                    // store jump target li in targets
                    targets.push(idx);
                    const phiPgm = this.compileTree(phi, idx);
                    // make room for phiPgm
                    idx += phiPgm.length;
                    optionals.push(phiPgm);
                }
                //idx is now just past the end of all the "optionals".
                let repetition: Program = [];
                for (let i = 0; i < optionals.length; i++) {
                    repetition.push({
                        type: "split",
                        left: (greedy ? targets[i] : idx),
                        right: (greedy ? idx : targets[i]),
                        index: targets[i] - 1,
                        source: tree
                    });
                    repetition.push(...(optionals[i]));
                }
                return preface.concat(repetition);
            } else {
                // A: split B, C; but must compile B first to get label for C
                const aIdx = idx;
                // make room for the split
                const bIdx = aIdx + 1;
                // then put in B
                const b = this.compileTree(phi, bIdx);
                const jump: Program = [{ type: "jump", target: aIdx, index: bIdx + b.length, source: tree }];
                // then label C
                const cIdx = bIdx + b.length + 1;
                const branch: Program = [{
                    type: "split",
                    left: (greedy ? bIdx : cIdx),
                    right: (greedy ? cIdx : bIdx),
                    index: idx,
                    source: tree
                }];
                return preface.concat(branch).concat(b).concat(jump);
            }
        }
        throw new Error("Can't compile " + JSON.stringify(tree));
    }

    compileSFA(sfa: SFA, idx: number): Program {
        let stateStarts = {}, endJumps: Jump[] = [];
        let pgm: Program = [];
        for (let i = 0; i < sfa.startStates.length; i++) {
            const start = sfa.startStates[i];
            const startPgm = this.compileSFA_(start, idx, stateStarts, endJumps);
            pgm = pgm.concat(startPgm);
            idx += startPgm.length;
        }
        for (let i = 0; i < endJumps.length; i++) {
            endJumps[i].target = idx;
        }
        return pgm;
    }

    compileSFA_(state: State, idx: number, stateStarts: { [key: string]: number }, endJumps: Jump[]): Program {
        if (state.id in stateStarts) {
            return [{
                type: "jump",
                target: stateStarts[state.id],
                index: idx,
                source: { type: "state", value: state.id }
            }] as Program;
        }
        stateStarts[state.id] = idx;
        if (state.edges.length == 0) {
            if (state.isAccepting) {
                const jump: Jump = {
                    type: "jump",
                    target: null,
                    index: idx,
                    source: { type: "state", value: state.id, children: [], range: { start: -1, end: -1 } }
                };
                endJumps.push(jump);
                return [jump] as Program;
            } else {
                throw new Error("Compiling an SFA state with no outgoing edges");
            }
        } else {
            let pgm: Program = [];
            for (let i = 0; i < state.edges.length - 1; i++) {
                const edge = state.edges[i];
                const edgeSplit: Split = {
                    type: "split",
                    left: idx + 1,
                    right: null,
                    index: idx,
                    source: {
                        type: "state", value: `${state.id}.${i}`,
                        children: [], range: { start: -1, end: -1 }
                    }
                };
                const edgePgm: Program = ([edgeSplit] as Program).concat(
                    this.compileSFA_edge(state, edge, idx + 1, stateStarts, endJumps)
                );
                pgm = pgm.concat(edgePgm);
                idx += edgePgm.length;
                edgeSplit.right = idx;
            }
            const edge = state.edges[state.edges.length - 1];
            const edgePgm = this.compileSFA_edge(state, edge, idx, stateStarts, endJumps);
            return pgm.concat(edgePgm);
        }
    }

    compileSFA_edge(state: State, edge: Edge, idx: number, stateStarts: { [id: string]: number }, endJumps: Jump[]): Program {
        //accepting self-edges need to be treated specially so they don't jump right back
        //to the parent state.
        const edgePgm: Program = this.compileSFA_edgeLabel(state, edge, idx);
        idx += edgePgm.length;
        if (state.isAccepting && edge.target == state && !edge.formula) {
            const jump: Jump = {
                type: "jump",
                target: null,
                index: idx,
                source: {
                    type: "edge", value: `${state.id}->${edge.target.id}`,
                    children: [], range: { start: -1, end: -1 }
                }
            };
            endJumps.push(jump);
            return edgePgm.concat([jump] as Program);
        } else if (edge.formula) {
            return edgePgm.concat([{
                type: "check",
                formula: edge.formula,
                index: idx,
                source: { type: "edge", value: `${state.id}->${edge.target!.id}` }
            }] as Program).concat(
                this.compileSFA_(edge.target!, idx + 1, stateStarts, endJumps)
            );
        } else {
            return edgePgm.concat(
                this.compileSFA_(edge.target!, idx, stateStarts, endJumps)
            );
        }
    }

    compileSFA_edgeLabel(state: State, edge: Edge, idx: number): Program {
        let pgm: Program = [];
        for (let i = 0; i < edge.label.length; i++) {
            const l = edge.label[i];
            if (l.type == "start-capture") {
                const captureID = this.captureIdx;
                const group = l.group;
                l.captureID = captureID;
                const start: Start = {
                    type: "start",
                    group: group,
                    captureID: captureID,
                    index: idx,
                    source: {
                        type: "edge", value: `${state.id}->${edge.target!.id}`,
                        children: [], range: { start: -1, end: -1 }
                    }
                };
                this.captureIdx++;
                pgm.push(start);
                idx++;
            } else if (l.type == "end-capture") {
                const captureID = l.start.captureID;
                const group = l.group;
                const end: End = {
                    type: "end",
                    group: group,
                    captureID: captureID,
                    index: idx,
                    source: {
                        type: "edge", value: `${state.id}->${edge.target!.id}`,
                        children: [], range: { start: -1, end: -1 }
                    }
                };
                pgm.push(end);
                idx++;
            }
        }
        return pgm;
    }

    compile(tree: ParseTree, debug: boolean = false): Program {
        // if (!tree.type && tree.tree && tree.errors && tree.remainder) {
        // throw new Error(
        // "Received a ParseResult, but expected a ParseTree." +
        // "Call compile() with the .tree element of " + tree
        // );
        // }
        if (!this.validateParseTree(tree)) {
            throw new Error("Parse tree did not represent a valid program");
        }
        resetStateID();
        this.captureIdx = 0;
        // We preface every program with "true .." so that all Playspecs are effectively start-anchored.
        // This is as per https://swtch.com/~rsc/regexp/regexp2.html
        const preface: Program = [
            { type: "split", left: 3, right: 1, index: 0, source: "root" },
            {
                type: "check",
                formula: {
                    type: parseTypes.TRUE,
                    value: true,
                    children: [],
                    range: { start: 0, end: 0 }
                },
                index: 1,
                source: "root"
            },
            { type: "jump", target: 0, index: 2, source: "root" },
            { type: "start", group: "$root", captureID: -1, index: 3, source: "root" }
        ];
        const body = this.compileTree(tree, preface.length);
        const result = preface.concat(body).concat([
            {
                type: "end",
                group: "$root",
                captureID: -1,
                index: preface.length + body.length,
                source: "root"
            },
            {
                type: "match",
                index: preface.length + body.length + 1,
                source: "root"
            }
        ]);
        if (!this.validateProgram(result)) {
            throw new Error(
                "Error compiling tree " + JSON.stringify(tree) + " into result " + JSON.stringify(result)
            );
        }
        if (!debug) {
            for (let i = 0; i < result.length; i++) {
                delete result[i].source;
                delete result[i].index;
            }
        }
        return result;
    }

    validateParseTree(parseTree: ParseTree): boolean {
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

    anyCapturesInsidePropositions(parent: ParseTree) {
        const prop = isPropositional(parent);
        for (let ci = 0; ci < parent.children.length; ci++) {
            const child = parent.children[ci];
            if (prop && child.type == parseTypes.CAPTURE) {
                console.log(`Can't put a capturing group inside of a propositional term: ${stringifyFormula(parent)}!`);
                return true;
            }
            if (this.anyCapturesInsidePropositions(child)) {
                return true;
            }
        }
        return false;
    }

    validateProgram(pgm: Program): boolean {
        // todo: validate programs against more basic sanity checks.
        //ensure each instruction's index is its index in pgm
        //ensure no split or jump goes beyond end of program
        //...
        if (!DEBUG_MODE) {
            return true;
        }
        for (let i = 0; i < pgm.length; i++) {
            const instr = pgm[i];
            //is its index correct?
            if (instr.index !== i) {
                throw new Error(`Bad code generation:${instr.index} != ${i} for ${stringify([instr])} in ${stringify(pgm)}`);
            }
        }
        const reachable = this.reachableInstructions(pgm, 0, {});
        for (let i = 0; i < pgm.length; i++) {
            if (!reachable[i]) {
                throw new Error(`Bad code generation:${i} not reachable for ${stringify([pgm[i]])} in ${stringify(pgm)}`);
            }
        }
        return true;
    }

    reachableInstructions(pgm: Program, i0: number, seen: { [point: number]: boolean }): { [point: number]: boolean } {
        //a loop, or else out of program code
        if ((i0 in seen) || i0 >= pgm.length) {
            return seen;
        }
        //mark i0 as seen
        seen[i0] = true;
        const other = pgm[i0];
        //follow indirection via recursive search, keeping track of seen locations
        if (other.type == "split") {
            let seenLeft = this.reachableInstructions(pgm, other.left, seen);
            return this.reachableInstructions(pgm, other.right!, seenLeft);
        } else if (other.type == "jump") {
            return this.reachableInstructions(pgm, other.target!, seen);
        } else {
            //for non-indirect instructions, just increment i0 and move on
            return this.reachableInstructions(pgm, i0 + 1, seen);
        }
    }
}

export function stringifyCustom(formula: ParseTree): string {
    const value = formula.value === undefined ? "" : formula.value.toString();
    const children = formula.children && formula.children.length ?
        (formula.children.map((c) => stringifyFormula(c))).join(",") :
        "";
    return `${formula.type}(${value},${children})`;
}

export function stringifyFormula(formula: ParseTree): string {
    switch (formula.type) {
        case parseTypes.TRUE:
            return "true";
        case parseTypes.FALSE:
            return "false";
        case parseTypes.START:
            return "start";
        case parseTypes.END:
            return "end";
        case parseTypes.AND:
            return `${stringifyFormula(formula.children[0])} & ${stringifyFormula(formula.children[1])}`;
        case parseTypes.OR:
            return `${stringifyFormula(formula.children[0])} | ${stringifyFormula(formula.children[1])}`;
        case parseTypes.NOT:
            return `not ${stringifyFormula(formula.children[0])}`;
        case parseTypes.GROUP:
            return `(${stringifyFormula(formula.children[0])})`;
        case parseTypes.CAPTURE:
            return `$${formula.value.captureID}:${formula.value.group}(${stringifyFormula(formula.children[0])})`;
        default:
            return stringifyCustom(formula);
    }
}

export function stringify(code: Program): string {
    let result = [];
    for (let i = 0; i < code.length; i++) {
        const instr = code[i];
        let instrStr = `${i}:${instr.type}`;
        switch (instr.type) {
            case "split":
                instrStr += ` ${instr.left} ${instr.right}`;
                break;
            case "jump":
                instrStr += ` ${instr.target}`;
                break;
            case "check":
                instrStr += " " + stringifyFormula(instr.formula);
                break;
            case "start":
            case "end":
                instrStr += ` ${instr.group} (${instr.captureID})`;
                break;
            case "match":
                break;
            default:
                throw new Error("Unrecognized instruction " + instr);
        }
        if (instr.source) {
            var src = instr.source!;
            if (src == "root") {
                instrStr += "  \t\t(root)";
            } else {
                if (instr.type == "check" && "range" in src) {
                    instrStr += `\t(ch. ${src.range.start}-${src.range.end})`;
                } else {
                    instrStr += `\t\t(${src.type} ${JSON.stringify(src.value)})`;
                }
            }
        }
        result.push(instrStr);
    }
    return result.join("\n");
}
