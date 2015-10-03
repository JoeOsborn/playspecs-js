import {parseTypes, isPropositional, cloneTree, BOUND_INFINITE} from "./parser";
import {stringifyFormula} from "./compiler";
let stateID = 0;

export function resetStateID() {
    stateID = 0;
}

export class SFA {
    constructor() {
        this.startStates = [new State()];
        this.acceptingStates = [];
    }

    newState(optID) {
        return new State(optID);
    }

    markAccepting(s) {
        //add to acceptingStates
        if (this.acceptingStates.indexOf(s) == -1) {
            this.acceptingStates.push(s);
        }
        //add accepting self-edge
        s.addEdge(new Edge(s, null, []));
        //mark accepting
        s.isAccepting = true;
    }

    markNonAccepting(s) {
        //mark non-accepting
        s.isAccepting = false;
        if (this.acceptingStates.indexOf(s) != -1) {
            //remove from acceptingStates
            s.acceptingStates.splice(s.acceptingStates.indexOf(s), 1);
        }
    }

    getStates() {
        let found = {};
        let stack = this.startStates.slice();
        while (stack.length) {
            const here = stack.pop();
            found[here.id] = here;
            for (let ek in here.edges) {
                let e = here.edges[ek];
                if (e.target && !(e.target.id in found)) {
                    stack.push(e.target);
                }
            }
        }
        return Object.keys(found).map((k) => found[k]);
    }

    toDot() {
        const start = "digraph g {\n" +
            "  rankdir=LR;\n";
        const middle = this.getStates().map(function (s) {
            return ["  " + s.id + ` [shape=${s.isAccepting ? "doublecircle" : "circle"}];`].concat(
                s.edges.map(function (e, i) {
                    return "  " + s.id + "->" + e.target.id +
                        ` [label="${i}:${e.formula ? stringifyFormula(e.formula) : "&#949;"}:${e.label.map((l) => l.type + "." + l.group).join(",")}"];`;
                })
            ).join("\n");
        }).join("\n");
        const end = "\n}";
        return start + middle + end;
    }

    eelim() {
        let stack = this.startStates.slice(), seen = {};
        for (let sk = 0; sk < stack.length; sk++) {
            seen[stack[sk].id] = stack[sk];
        }
        while (stack.length) {
            const s = stack.pop();
            let reachable = {[s.id]: s};
            for (let i = 0; i < s.edges.length; i++) {
                const e = s.edges[i];
                //e is a null transition but not an accepting null transition
                if (!e.formula && !(s.isAccepting && e.target == s)) {
                    if (e.target.id in reachable) {
                        s.edges.splice(i, 1);
                        i--;
                        continue;
                    } else {
                        const targetEs = e.target.edges;
                        const newEs = targetEs.map((te) => new Edge(te.target == e.target && te.formula == null ? s : te.target, te.formula, e.label.concat(te.label)));
                        if (e.target.isAccepting && !s.isAccepting) {
                            this.acceptingStates.push(s);
                            s.isAccepting = true;
                        }
                        s.edges.splice(i, 1, ...newEs);
                    }
                }
                reachable[e.target.id] = e.target;
            }
            for (let rk in reachable) {
                if (!(rk in seen)) {
                    stack.push(reachable[rk]);
                    seen[rk] = reachable[rk];
                }
            }
        }
        return this;
    }

    intersect(b) {
        this.eelim();
        const a = this;
        b.eelim();
        let axb = new SFA();
        axb.startStates = [];
        let stack = [], states = {};
        for (let i = 0; i < a.startStates.length; i++) {
            const sa = a.startStates[i];
            for (let j = 0; j < b.startStates.length; j++) {
                const sb = b.startStates[j];
                stack.push([sa, sb]);
                if (!(sa.id in states)) {
                    states[sa.id] = {};
                }
                let sasb = axb.newState(`a${sa.id}x${sb.id}b`);
                axb.startStates.push(sasb);
                states[sa.id][sb.id] = sasb;
                if (sa.isAccepting && sb.isAccepting) {
                    axb.markAccepting(sasb);
                }
            }
        }
        while (stack.length) {
            const [sa,sb] = stack.pop();
            const sab = states[sa.id][sb.id];
            for (let i = 0; i < sa.edges.length; i++) {
                const ae = sa.edges[i];
                const aet = ae.target;
                const aeIsAcceptingSelfEdge = sa.isAccepting && aet == sa && !ae.formula;
                for (let j = 0; j < sb.edges.length; j++) {
                    const be = sb.edges[j];
                    const bet = be.target;
                    const beIsAcceptingSelfEdge = sb.isAccepting && bet == sb && !be.formula;
                    let phi = null;
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
                    let combined = null;
                    if (aet.id in states && bet.id in states[aet.id]) {
                        combined = states[aet.id][bet.id];
                    } else {
                        combined = axb.newState(`a${aet.id}x${bet.id}b`);
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
}

function intersectFormulae(p1, p2) {
    //todo: fixme: implement for real
    return {type: parseTypes.AND, value: "&", children: [p1, p2], range: {start: -1, end: -1}};
}

class State {
    constructor(id) {
        this.id = id || (stateID++);
        this.edges = [];
        this.isAccepting = false;
    }

    addEdge(e) {
        this.edges.push(e);
    }

    removeEdge(e) {
        this.edges.splice(this.edges.indexOf(e), 1);
    }
}

class Edge {
    constructor(target, formula, label) {
        this.target = target;
        this.formula = formula;
        this.label = label;
    }
}

export function fromParseTree(tree) {
    const sfa = new SFA();
    const s = sfa.startStates[0];
    const outEdges = build(sfa, s, tree);
    const terminus = sfa.newState();
    for (let ek = 0; ek < outEdges.length; ek++) {
        const e = outEdges[ek];
        e.target = terminus;
    }
    sfa.markAccepting(terminus);
    return sfa;
}

function build(sfa, seedState, tree) {
    if (isPropositional(tree) && tree.type != parseTypes.CAPTURE) {
        const e = new Edge(null, tree, []);
        seedState.addEdge(e);
        return [e];
    } else if (tree.type == parseTypes.CONCATENATION) {
        const aes = build(sfa, seedState, tree.children[0]);
        const s = sfa.newState();
        for (let ek = 0; ek < aes.length; ek++) {
            let e = aes[ek];
            e.target = s;
        }
        return build(sfa, s, tree.children[1]);
    } else if (tree.type == parseTypes.REPETITION) {
        const greedy = tree.value.greedy;
        const min = tree.value.lowerBound;
        const max = tree.value.upperBound;
        const phi = tree.children[0];
        if (min > 0) {
            let cloned = cloneTree(tree);
            cloned.value.lowerBound--;
            if (cloned.value.upperBound != "$END") {
                cloned.value.upperBound--;
            }
            let next = {
                type: parseTypes.CONCATENATION,
                value: ",",
                children: [cloneTree(phi), cloned],
                range: {start: cloned.start, end: cloned.end}
            };
            return build(sfa, seedState, next);
        } else if (max != "$END") {
            let cloned = cloneTree(tree);
            cloned.value.upperBound--;
            let next = {
                type: parseTypes.CONCATENATION,
                value: ",",
                children: [cloneTree(phi), cloned],
                range: {start: cloned.start, end: cloned.end}
            };
            //Lots of duplication here when only orderings are changed. Not so proud of it
            //but let's just make sure it's working first.
            if (greedy) {
                let edges = [];
                if (max == 0) {
                    edges = edges.concat([new Edge(null, phi, [])]);
                } else {
                    edges = edges.concat(build(sfa, seedState, next));
                }
                const out = new Edge(null, null, []);
                seedState.addEdge(out);
                edges.push(out);
                return edges;
            } else {
                let edges = [];
                const out = new Edge(null, null, []);
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
                let edges = build(sfa, seedState, phi);
                for (let ek = 0; ek < edges.length; ek++) {
                    let e = edges[ek];
                    e.target = seedState;
                }
                const e = new Edge(null, null, []);
                seedState.addEdge(e);
                return [e];
            } else {
                const e = new Edge(null, null, []);
                seedState.addEdge(e);
                let edges = build(sfa, seedState, phi);
                for (let ek = 0; ek < edges.length; ek++) {
                    let e = edges[ek];
                    e.target = seedState;
                }
                return [e];
            }
        }
    } else if (tree.type == parseTypes.GROUP) {
        let s = sfa.newState();
        seedState.addEdge(new Edge(s, null, []));
        const es = build(sfa, s, tree.children[0]);
        return es;
    } else if (tree.type == parseTypes.CAPTURE) {
        let s = sfa.newState();
        //hack: we store a link from the end to its corresponding start
        //so that the correct captureID can be propagated to the "end"
        //from the "start" during compilation
        let captureStart = {type: "start-capture", group: (tree.value.group == "$implicit" ? s.id : tree.value.group)};
        seedState.addEdge(new Edge(s, null, [captureStart]));
        const es = build(sfa, s, tree.children[0]);
        for (let ek = 0; ek < es.length; ek++) {
            let e = es[ek];
            e.label.push({
                type: "end-capture",
                group: (tree.value.group == "$implicit" ? s.id : tree.value.group),
                start: captureStart
            });
        }
        return es;
    } else if (tree.type == parseTypes.ALTERNATION) {
        const a = sfa.newState();
        const b = sfa.newState();
        seedState.addEdge(new Edge(a, null, []));
        seedState.addEdge(new Edge(b, null, []));
        const aes = build(sfa, a, tree.children[0]);
        const bes = build(sfa, b, tree.children[1]);
        return aes.concat(bes);
    } else if (tree.type == parseTypes.INTERSECTION) {
        const a = fromParseTree(tree.children[0]);
        const b = fromParseTree(tree.children[1]);
        const axb = a.intersect(b);
        const oldAccepting = axb.acceptingStates.slice();
        //console.log("Supposed accepting:", oldAccepting, "actual",
        //    axb.getStates().filter((s) => s.isAccepting)
        //);
        for (let startk = 0; startk < axb.startStates.length; startk++) {
            seedState.addEdge(new Edge(axb.startStates[startk], null, []));
        }
        let outEdges = [];
        for (let acck = 0; acck < oldAccepting.length; acck++) {
            const acc = oldAccepting[acck];
            sfa.markNonAccepting(acc);
            //find the self-edge and repoint it towards nothing, including it in outEdges
            for (let ei = 0; ei < acc.edges.length; ei++) {
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