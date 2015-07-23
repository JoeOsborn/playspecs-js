/* @flow */

import {parseTypes, isPropositional, BOUND_INFINITE} from "./parser";

type
Instruction =
    {type: "check", formula: ParseTree, index: number} |
    {type: "jump", target: number, index: number} |
    {type: "split", left: number, right: number, index: number} |
    {type: "match", index: number};
type
Program = Array < Instruction >;

export class Compiler {
    constructor(_ctx) {

    }

    compileTree(tree:ParseTree, idx:number):Program {
        if (tree.type == parseTypes.GROUP) {
            // TODO: submatch saving
            return this.compileTree(tree.children[0], idx);
        }
        if (isPropositional(tree)) {
            console.log("tree " + JSON.stringify(tree) + ":" + tree.type + " is propositional");
            return [{type: "check", formula: tree, index: idx}];
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
            const branch = [{type: "split", left: aIdx, right: bIdx, index: idx}];
            // right:
            const right = this.compileTree(tree.children[1], bIdx);
            const cIdx = bIdx + right.length;
            const jump = [{type: "jump", target: cIdx, index: aIdx + left.length}];
            return branch.concat(left).concat(jump).concat(right);
        }
        if (tree.type == parseTypes.INTERSECTION) {
            // TODO: intersection
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
                let repetition = [];
                for (let i = 0; i < optionals.length; i++) {
                    repetition.push({
                        type: "split",
                        left: (greedy ? targets[i] : idx),
                        right: (greedy ? idx : targets[i]),
                        index: targets[i] - 1
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
                const jump = [{type: "jump", target: aIdx, index: bIdx + b.length}];
                // then label C
                const cIdx = bIdx + b.length + 1;
                const branch = [{
                    type: "split",
                    left: (greedy ? bIdx + 1 : cIdx),
                    right: (greedy ? cIdx : bIdx + 1),
                    index: idx
                }];
                return preface.concat(branch).concat(b).concat(jump);
            }
        }
        throw new Error("Can't compile " + JSON.stringify(tree));
        return [];
    }

    compile(tree:ParseTree):Program {
        // We preface every program with "true .." so that all Playspecs are effectively start-anchored.
        // This is as per https://swtch.com/~rsc/regexp/regexp2.html
        const preface = [
            {type: "split", left: 2, right: 1, index: 0},
            {
                type: "check",
                formula: {
                    type: parseTypes.TRUE,
                    value: true,
                    children: [],
                    range: {start: 0, end: 0}
                },
                index: 1
            },
            {type: "jump", target: 0, index: 2}
        ];
        const body = this.compileTree(tree, preface.length);
        const result = preface.concat(body).concat([{type: "match", index: preface.length + body.length}]);
        if (!this.validate(result)) {
            throw new Error(
                "Error compiling tree " + JSON.stringify(tree) + " into result " + JSON.stringify(result)
            );
        }
        return result;
    }

    validate(pgm:Program):bool {
        // todo: validate programs against some basic sanity checks.
        //ensure each instruction's index is its index in pgm
        //ensure no split or jump goes beyond end of program
        //...
        return true;
    }
}