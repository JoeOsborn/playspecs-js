/* @flow */

import {parseTypes, Parser} from "./parser.js";
import Compiler from "./compiler.js";

export default class Playspec {
    constructor(spec:string, context, debug:boolean = false) {
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
                if (this.checkAPI[formula.type]) {
                    return this.checkAPI[formula.type](trace, state, idx, formula);
                } else {
                    throw new Error("Unrecognized propositional formula");
                }
        }
    }

    match(trace:Trace<State>, preserveStates:boolean = false):PlayspecResult {
        return (new PlayspecResult({
            spec: this,
            preserveStates
        }, {trace: trace}, undefined)).next();
    }
}

class Thread {
    constructor(id:number, pc:number, priority:number, matches:Array<Match>) {
        this.id = id;
        this.pc = pc;
        this.priority = priority;
        //match sharing: instead set this.matches to matches and set sharedMatches to true
        this.matches = matches.map(function (m) {
            let m2 = cloneMatch(m);
            m2.priority = Math.max(priority, m.priority);
            return m2;
        });
    }

    equals(t2:Thread):boolean {
        return this.pc == t2.pc;
    }

    hash():number {
        return this.pc;
    }

    mergeThread(other:Thread) {
        // Match sharing: if matches are shared, replace matches list with slice of matches list,
        // and insert either clones of other's matches (if other is sharing matches) or other's matches directly
        // Also update priority of new matches
        for (let i = 0; i < other.matches.length; i++) {
            let found = false;
            for (let j = 0; j < this.matches.length; j++) {
                if (matchEquivFn(this.matches[j], other.matches[i])) {
                    found = true;
                }
            }
            if (!found) {
                let match = cloneMatch(other.matches[i]);
                match.priority = Math.max(this.priority, this.matches[i].priority);
                this.matches.push(match);
            }
        }
        // Merge any other state
    }

    hasOpenMatch():boolean {
        for (let i = 0; i < this.matches.length; i++) {
            if (this.matches[i].instructions.length > 0) {
                return true;
            }
        }
        return false;
    }

    pushMatchInstruction(instr:MatchInstruction) {
        // Match sharing: if matches are shared, replace matches list with a new list containing clones of matches
        // Also update priority of matches
        // And set sharedMatches to false
        for (let i = 0; i < this.matches.length; i++) {
            this.matches[i].instructions.push(instr);
        }
    }

    terminate() {
        // Let matches, and thus kept states, be garbage collected
        this.matches = null;
    }
}

class NonReplacingHashMap {
    constructor(equivFn:Function, hashFn:Function, bucketCount:number = 1000) {
        this.equiv = equivFn;
        this.hash = hashFn;
        this.coll = new Array(bucketCount);
        this.length = 0;
    }

    bucketFind(bucket, obj) {
        for (let i = 0; i < bucket.length; i++) {
            if (this.equiv ? this.equiv(bucket[i].key, obj) : bucket[i].key == obj) {
                return bucket[i].val;
            }
        }
        return undefined;
    }

    // If val is not provided, it defaults to true
    // Unlike a regular map, this will NOT replace existing keys!
    push(obj, val = undefined) {
        if (!val) {
            val = true;
        }
        const hashCode = this.hash ? (this.hash(obj) % this.coll.length) : obj;
        let bucket = this.coll[hashCode];
        if (!bucket) {
            this.coll[hashCode] = [{key: obj, val: val}];
        } else {
            if (this.bucketFind(bucket, obj) !== undefined) {
                return false;
            } else {
                bucket.push({key: obj, val: val});
            }
        }
        this.length++;
        return true;
    }

    get(obj) {
        if (this.length == 0) {
            return undefined;
        }
        const hashCode = this.hash ? (this.hash(obj) % this.coll.length) : obj;
        let bucket = this.coll[hashCode];
        if (!bucket) {
            return undefined;
        }
        return this.bucketFind(bucket, obj);
    }

    clear() {
        for (let i = 0; i < this.coll.length; i++) {
            //todo: generate less garbage?
            this.coll[i] = null;
        }
        this.length = 0;
    }

    contains(obj) {
        if (this.length == 0) {
            return false;
        }
        const hashCode = this.hash ? (this.hash(obj) % this.coll.length) : obj;
        let bucket = this.coll[hashCode];
        if (!bucket) {
            return false;
        }
        return this.bucketFind(bucket, obj) !== undefined;
    }
}

function hashInt(h, int32) {
    h += (int32) | 0;
    h += (h << 10) | 0;
    h ^= (h >> 6) | 0;
    h += ((int32 >> 8)) | 0;
    h += (h << 10) | 0;
    h ^= (h >> 6) | 0;
    h += ((int32 >> 16)) | 0;
    h += (h << 10) | 0;
    h ^= (h >> 6) | 0;
    h += ((int32 >> 24)) | 0;
    h += (h << 10) | 0;
    h ^= (h >> 6) | 0;
    return h;
}
function finalizeHash(h:number):number {
    h += (h << 3) | 0;
    h ^= (h >> 11) | 0;
    h += (h << 15) | 0;
    return h;
}
function hashNumbers(...numbers:Array<Number>):number {
    let h = 0;
    for (let i = 0; i < numbers.length; i++) {
        h = hashInt(h, numbers[i]);
    }
    return finalizeHash(h);
}

type
MatchInstruction = {type: "start" | "end", target: string | number, index: number} |
    {type: "state", index: number, state: any};
type
Match = {priority: number, instructions: Array < MatchInstruction >};

const matchEquivFn = function (a:Match, b:Match) {
    if (a.instructions.length != b.instructions.length) {
        return false;
    }
    for (let i = 0; i < a.instructions.length; i++) {
        if (a[i].type != b[i].type || a[i].index != b[i].index || a[i].target != b[i].target) {
            return false;
        }
    }
    return true;
}
const matchHashFn = function (a:Match) {
    return hashNumbers(a.instructions.length);
}

function cloneMatch(m:Match):Match {
    return {
        priority: m.priority,
        instructions: m.instructions.slice()
    };
}

class NonShrinkingArray {
    constructor() {
        this.array = [];
        this.length = 0;
    }

    push(obj) {
        this.array[this.length] = obj;
        this.length++;
    }

    clear() {
        this.length = 0;
    }

    get first():any {
        if (this.length == 0) {
            return undefined;
        }
        return this.array[0];
    }

    get(i:number):any {
        if (i < 0 || i >= this.length) {
            return undefined;
        }
        return this.array[i];
    }
}

// We know a priori that the number of priority levels is relatively small
class PriorityQueue {
    constructor(pfn:Function, equivFn:Function, hashFn:Function) {
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

    // We also know a priori that duplicates will be detected externally if there is no equivFn/hashFn
    push(obj) {
        const idx = this.priorityFunction(obj);
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

    shift():any {
        if (this.lowestPriority >= Infinity || this.length == 0) {
            return null;
        }
        const q = this.queues[this.lowestPriority];
        // Within a priority level, we want the _reverse_ order of addition
        const result = q.pop();
        if (q.length == 0) {
            delete this.queues[this.lowestPriority];
            if (this.highestPriority <= this.lowestPriority) {
                this.lowestPriority = Infinity;
                this.highestPriority = -Infinity;
            } else {
                while (!(this.queues[this.lowestPriority]) && this.lowestPriority < this.highestPriority) {
                    this.lowestPriority++;
                }
            }
        }
        this.length--;
        return result;
    }

    get first():any {
        if (this.length == 0) {
            return undefined;
        }
        return this.queues[this.lowestPriority][0];
    }

    clear() {
        //todo: generate less garbage
        this.queues = [];
        this.lowestPriority = Infinity;
        this.highestPriority = -Infinity;
        this.length = 0;
        if (this.members) {
            this.members.clear();
        }
    }
}

const LIVESET_CLEAR_INTERVAL = 100;

class PlayspecResult {
    constructor(config:{spec:Playspec, preserveStates:boolean},
                state:{trace:Trace<State>, threads:Array<Thread>, maxThreadID:number},
                match:PlayspecMatchResult) {
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
                matchQueue: new PriorityQueue((m:Match) => m.priority),
                matchSet: new NonReplacingHashMap(matchEquivFn, matchHashFn),
                lastMatchPriority: 0
            };
            let initThread = new Thread(0, 0, 0, [{priority: 0, instructions: []}]);
            this.enqueueThread(initThread);
            //swap queues
            const temp = this.state.queue;
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

    get start() {
        return this.match ? this.match.start : -1;
    }

    get end() {
        return this.match ? this.match.end : -1;
    }

    get states() {
        return this.match ? this.match.states : undefined;
    }

    hasReadyMatch():boolean {
        if (!this.state.matchQueue.length) {
            return false;
        }
        if (!this.state.queue.length) {
            return true;
        }
        return this.state.matchQueue.first.priority <= this.state.queue.first.priority
    }

    enqueueThread(thread) {
        // Unlike Cox's implementation, we can only do duplicate checking for threads that are about to park.
        // So we'll do some redundant jumping/splitting/matching, but since we need to merge threads it can't
        // really be avoided.
        const instr = this.config.spec.program[thread.pc];
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
                const thread2 = new Thread(this.state.maxThreadID, instr.right, thread.priority + 1, thread.matches);
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
                for (let i = 0; i < thread.matches.length; i++) {
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
                const hash = thread.hash();
                let live = this.state.liveSet.get(hash);
                if (!live) {
                    let threadList = new NonShrinkingArray();
                    threadList.push(thread);
                    this.state.liveSet.push(hash, {index: this.state.index, threads: threadList});
                } else if (live.index != this.state.index) {
                    live.index = this.state.index;
                    live.threads.clear();
                    live.threads.push(thread);
                } else {
                    //maybe present
                    for (let i = 0; i < live.threads.length; i++) {
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

    prettifyMatch(m:Match) {
        let groups = [];
        let liveGroups = {};
        for (let i = 0; i < m.instructions.length; i++) {
            const instr = m.instructions[i];
            switch (instr.type) {
                case "start":
                    let newG = {group: instr.target, start: instr.index, end: Infinity};
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
                    let openGroups = Object.getOwnPropertyNames(liveGroups);
                    for (let gi = 0; gi < openGroups.length; gi++) {
                        let continuedG = liveGroups[openGroups[gi]];
                        continuedG.states.push(instr.state);
                    }
                    break;
                case "end":
                    let finishedG = liveGroups[instr.target];
                    finishedG.end = instr.index;
                    delete liveGroups[instr.target];
                    break;
            }
        }
        let openGroups = Object.getOwnPropertyNames(liveGroups);
        if (openGroups.length) {
            throw new Error(`Open capture groups: ${openGroups.join(",")}`);
        }
        let rootGroup = groups.shift();
        let rootMatch = {start:rootGroup.start, end:rootGroup.end, subgroups:groups};
        if(this.config.preserveStates) {
            rootMatch.states = rootGroup.states;
        }
        return rootMatch;
    }

    next():PlayspecResult {
        if (!this.state) {
            throw new Error("Don't call next() on the same PlayspecResult twice!");
        }
        while (!this.hasReadyMatch() && this.state.queue.length) {
            const state = this.config.spec.traceAPI.currentState(this.state.trace);
            let copiedState = undefined;
            const limit = this.state.queue.length;
            let lastPriority = 0;
            for (let t = 0; t < this.state.queue.length; t++) {
                if (t >= limit) {
                    throw new Error("The thread queue should never grow during a single trace state!");
                }
                if (t.priority < lastPriority) {
                    throw new Error("Decreasing priority!");
                }
                let thread = this.state.queue.get(t);
                const instr = this.config.spec.program[thread.pc];
                switch (instr.type) {
                    case "check":
                        const checkResult = this.config.spec.check(
                            this.state.trace,
                            state,
                            this.state.index,
                            instr.formula
                        );
                        if (checkResult) {
                            thread.pc++;
                            if (thread.hasOpenMatch) {
                                if (this.config.preserveStates) {
                                    if (!copiedState) {
                                        copiedState = this.config.spec.traceAPI.copyCurrentState ?
                                            this.config.spec.traceAPI.copyCurrentState() :
                                            state;
                                    }
                                    thread.pushMatchInstruction({
                                        type: "state",
                                        index: this.state.index,
                                        state: copiedState
                                    });
                                }
                            }
                            this.enqueueThread(thread);
                        } else { //otherwise drop the thread on the floor
                            thread.terminate();
                        }
                        break;
                    default:
                        throw new Error("Thread should be parked on a check.");
                }
            }
            //swap queues and clear old queue
            let temp = this.state.queue;
            this.state.queue = this.state.nextQueue;
            temp.clear();
            this.state.nextQueue = temp;
            //maybe clear liveset (don't want to do it every time, so short specs/strings can avoid memory churn)
            if ((this.state.index % LIVESET_CLEAR_INTERVAL) == 0) {
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
            const match = this.state.matchQueue.shift();
            if (this.state.lastMatchPriority > match.priority) {
                throw new Error("Matches popped out of order!");
            }
            this.state.lastMatchPriority = match.priority;
            const prettyMatch = this.prettifyMatch(match);
            const nextState = this.state;
            this.state = undefined;
            return new PlayspecResult(
                this.config,
                nextState,
                prettyMatch
            );
        } // Otherwise, we're out of queue or trace and have nowhere to go
        this.state = undefined;
        return null;
    }
}