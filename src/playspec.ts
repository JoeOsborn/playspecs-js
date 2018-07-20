import { PlayspecsContext } from "./types";
import { parseTypes, Parser, ParseResult } from "./parser";
import { ParseTree } from "./types";
import { Compiler, Program } from "./compiler";
export class Playspec<Trace, State> {
    context: PlayspecsContext<Trace, State>;
    spec: string;
    parseResult: ParseResult;
    program: Program;
    constructor(spec: string, context: PlayspecsContext<Trace, State>, debug: boolean = false) {
        this.context = context;
        this.spec = spec;
        const parser = new Parser(context.tokens);
        const compiler = new Compiler(context.tokens);
        this.parseResult = parser.parse(spec);
        if (this.parseResult.errors.length) {
            throw new Error("Parsed with errors:" + JSON.stringify(this.parseResult.errors));
        }
        this.program = compiler.compile(this.parseResult.tree, debug);
    }
    get traceAPI() {
        return this.context.trace;
    }
    get checkAPI() {
        return this.context.checks;
    }
    check(trace: Trace, state: State, idx: number, formula: ParseTree): any {
        var left, right;
        //TODO: generate less garbage on check results
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
                left = this.check(trace, state, idx, formula.children[0]);
                right = this.check(trace, state, idx, formula.children[1]);
                if (left && right) {
                    return { node: formula, left: left, right: right };
                }
                return false;
            case parseTypes.OR:
                left = this.check(trace, state, idx, formula.children[0]);
                right = this.check(trace, state, idx, formula.children[1]);
                if (left || right) {
                    return { node: formula, left: left, right: right };
                }
                return false;
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

    match(trace: Trace, preserveStates: false | true | "explicit" = false): PlayspecResult<Trace, State> | null {
        return (new PlayspecResult({
            spec: this,
            preserveStates
        }, playspecResultStateInit(trace), undefined)).next();
    }
}

function playspecResultStateInit<T>(trace: T): PlayspecResultState<T> {
    return {
        // We can use plain arrays for the priority queue for now, since we know threads will be added
        // in priority order. This also means we never shift, but increment i going up through the queue.
        queue: new NonShrinkingArray<Thread>(),
        nextQueue: new NonShrinkingArray<Thread>(),
        threads: [],
        // This NonReplacingHashMap will have number keys so it can use default hash/equiv
        liveSet: new NonReplacingHashMap<number, ThreadState>(
            ((a, b) => a == b),
            ((a) => a)
        ),
        maxThreadID: 0,
        // We start at -1 since the initial actions of the initial thread
        // should happen before the trace reaches index 0. This mainly ensures that
        // capture groups line up correctly.
        index: -1,
        pastEnd: false,
        trace: trace,
        // Same here for matches, always added in priority order -- but can use a regular array
        matchQueue: new PriorityQueue(
            (m: Match) => m.priority
        ),
        matchSet: new NonReplacingHashMap(matchEquivFn, matchHashFn),
        lastMatchPriority: 0
    };
}

class Thread {
    id: number;
    pc: number;
    priority: number;
    matches: Match[];
    constructor(id: number, pc: number, priority: number, matches: Array<Match>) {
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

    equals(t2: Thread): boolean {
        return this.pc == t2.pc;
    }

    hash(): number {
        return this.pc;
    }

    mergeThread(other: Thread) {
        // Match sharing: if matches are shared, replace matches list with slice of matches list,
        // and insert either clones of other's matches (if other is sharing matches) or other's matches directly
        // Also update priority of new matches
        for (let i = 0; i < other.matches.length; i++) {
            let found = false;
            for (let j = 0; j < this.matches.length; j++) {
                if (matchEquivFn(this.matches[j], other.matches[i])) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                let match = cloneMatch(other.matches[i]);
                match.priority = Math.max(this.priority, match.priority);
                this.matches.push(match);
            }
        }
        // Merge any other state
    }

    hasOpenMatch(): boolean {
        for (let i = 0; i < this.matches.length; i++) {
            if (this.matches[i].instructions.length > 0) {
                return true;
            }
        }
        return false;
    }

    hasExplicitMatch(): boolean {
        for (let i = 0; i < this.matches.length; i++) {
            if (this.matches[i].instructions.length > 0 &&
                (this.matches[i].instructions[0] as MatchStartEnd).groupIndex != -1) {
                return true;
            }
        }
        return false;
    }

    pushMatchInstruction(instr: MatchInstruction) {
        // Match sharing: if matches are shared, replace matches list with a new list containing clones of matches
        // Also update priority of matches
        // And set sharedMatches to false
        for (let i = 0; i < this.matches.length; i++) {
            this.matches[i].instructions.push(instr);
        }
    }

    terminate() {
        // Let matches, and thus kept states, be garbage collected
        this.matches = [];
    }
}

class Item<K, V> {
    key: K;
    val: V;
    constructor(k: K, v: V) {
        this.key = k;
        this.val = v;
    }
}

class NonReplacingHashMap<K, V> {
    equiv: (a: K, b: K) => boolean;
    hash: (a: K) => number;
    coll: Item<K, V>[][];
    length: number;
    constructor(
        equivFn: (a: K, b: K) => boolean,
        hashFn: (a: K) => number,
        bucketCount: number = 1000) {
        this.equiv = equivFn;
        this.hash = hashFn;
        this.coll = new Array(bucketCount);
        this.length = 0;
    }

    bucketFind(bucket: Item<K, V>[], obj: K) {
        for (let i = 0; i < bucket.length; i++) {
            if (this.equiv ? this.equiv(bucket[i].key, obj) : bucket[i].key == obj) {
                return bucket[i].val;
            }
        }
        return undefined;
    }

    // If val is not provided, it defaults to true
    // Unlike a regular map, this will NOT replace existing keys!
    push(obj: K, val: V) {
        const hashCode = this.hash(obj) % this.coll.length;
        let bucket = this.coll[hashCode];
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

    get(obj: K): V | undefined {
        if (this.length == 0) {
            return undefined;
        }
        const hashCode = this.hash(obj) % this.coll.length;
        let bucket = this.coll[hashCode];
        if (!bucket) {
            return undefined;
        }
        return this.bucketFind(bucket, obj);
    }

    clear(): void {
        for (let i = 0; i < this.coll.length; i++) {
            //todo: generate less garbage?
            this.coll[i] = [];
        }
        this.length = 0;
    }

    contains(obj: K): boolean {
        if (this.length == 0) {
            return false;
        }
        const hashCode = this.hash(obj) % this.coll.length;
        let bucket = this.coll[hashCode];
        if (!bucket) {
            return false;
        }
        return this.bucketFind(bucket, obj) !== undefined;
    }
}

function hashInt(h: number, int32: number): number {
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
function finalizeHash(h: number): number {
    h += (h << 3) | 0;
    h ^= (h >> 11) | 0;
    h += (h << 15) | 0;
    return h;
}
function hashNumbers(...numbers: number[]): number {
    let h = 0;
    for (let i = 0; i < numbers.length; i++) {
        h = hashInt(h, numbers[i]);
    }
    return finalizeHash(h);
}
type MatchStartEnd = {
    type: "start" | "end",
    group: string | number,
    groupIndex: number,
    index: number
};
type MatchRegisterState = { type: "state", index: number, state: any, result: any };
type MatchInstruction = MatchStartEnd | MatchRegisterState;
type Match = { priority: number, instructions: Array<MatchInstruction> };

const matchEquivFn = function (a: Match, b: Match) {
    if (a.instructions.length != b.instructions.length) {
        return false;
    }
    for (let i = 0; i < a.instructions.length; i++) {
        const insA = a.instructions[i];
        const insB = b.instructions[i];
        if (insA.type != insB.type ||
            insA.index != insB.index ||
            ((insA as MatchStartEnd).group != (insB as MatchStartEnd).group)) {
            return false;
        }
    }
    return true;
}
const matchHashFn = function (a: Match) {
    return hashNumbers(a.instructions.length);
}

function cloneMatch(m: Match): Match {
    return {
        priority: m.priority,
        instructions: m.instructions.slice()
    };
}

class NonShrinkingArray<T> {
    array: T[];
    length: number;
    constructor() {
        this.array = [];
        this.length = 0;
    }

    push(obj: T): void {
        this.array[this.length] = obj;
        this.length++;
    }

    clear(): void {
        this.length = 0;
    }

    get first(): T | undefined {
        if (this.length == 0) {
            return undefined;
        }
        return this.array[0];
    }

    get(i: number): T | undefined {
        if (i < 0 || i >= this.length) {
            return undefined;
        }
        return this.array[i];
    }
}

// We know a priori that the number of priority levels is relatively small
class PriorityQueue<T> {
    queues: T[][];
    members: NonReplacingHashMap<T, boolean> | undefined;
    priorityFunction: (t: T) => number;
    length: number;
    lowestPriority: number;
    highestPriority: number;
    constructor(
        pfn: (t: T) => number,
        equivFn?: (t1: T, t2: T) => boolean,
        hashFn?: (t: T) => number) {
        this.queues = [];
        this.priorityFunction = pfn;
        this.length = 0;
        this.lowestPriority = Infinity;
        this.highestPriority = -Infinity;
        if (equivFn && hashFn) {
            this.members = new NonReplacingHashMap(equivFn, hashFn);
        } else {
            this.members = undefined;
        }
        this.clear();
    }

    // We also know a priori that duplicates will be detected externally if there is no equivFn/hashFn
    push(obj: T): boolean {
        const idx = this.priorityFunction(obj);
        if (this.members) {
            if (this.members.contains(obj)) {
                return false;
            }
            this.members.push(obj, true);
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

    shift(): T | undefined {
        if (this.lowestPriority >= Infinity || this.length == 0) {
            return undefined;
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

    get first(): T | undefined {
        if (this.length == 0) {
            return undefined;
        }
        return this.queues[this.lowestPriority][0];
    }

    clear(): void {
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

type ThreadState = {
    index: number,
    threads: NonShrinkingArray<Thread>
};

type PlayspecResultState<Trace> = {
    trace: Trace,
    threads: Thread[],
    maxThreadID: number,
    queue: NonShrinkingArray<Thread>,
    nextQueue: NonShrinkingArray<Thread>,
    liveSet: NonReplacingHashMap<number, ThreadState>,
    index: number,
    pastEnd: boolean,
    matchQueue: PriorityQueue<Match>,
    matchSet: NonReplacingHashMap<Match, boolean>,
    lastMatchPriority: number
};

type GroupData<State> = {
    group: string | number,
    groupIndex: number,
    start: number,
    end: number,
    states: State[] | undefined,
    results: any[] | undefined
};

type PlayspecMatchResult<State> = {
    start: number,
    end: number,
    states?: State[],
    results?: any[],
    subgroups: GroupData<State>[]
};

class PlayspecResult<Trace, State> {
    config: { spec: Playspec<Trace, State>, preserveStates: false | true | "explicit" };
    state: PlayspecResultState<Trace> | undefined;
    match: PlayspecMatchResult<State> | undefined;
    constructor(
        config: { spec: Playspec<Trace, State>, preserveStates: false | true | "explicit" },
        state: PlayspecResultState<Trace>,
        match: PlayspecMatchResult<State> | undefined) {
        this.config = config;
        this.state = state;
        if (this.state.index == -1) {
            this.state.trace = this.config.spec.traceAPI.start(this.state.trace);
            let initThread = new Thread(0, 0, 0, [{ priority: 0, instructions: [] }]);
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

    get subgroups() {
        return this.match ? this.match.subgroups : undefined;
    }

    hasReadyMatch(): boolean {
        if (!this.state!.matchQueue.length) {
            return false;
        }
        if (!this.state!.queue.length) {
            return true;
        }
        return this.state!.matchQueue.first!.priority <= this.state!.queue.first!.priority
    }

    enqueueThread(thread: Thread) {
        // Unlike Cox's implementation, we can only do duplicate checking for threads that are about to park.
        // So we'll do some redundant jumping/splitting/matching, but since we need to merge threads it can't
        // really be avoided.
        const instr = this.config.spec.program[thread.pc];
        switch (instr.type) {
            case "jump":
                thread.pc = instr.target!;
                this.enqueueThread(thread);
                return;
            case "split":
                this.state!.maxThreadID!++;
                thread.pc = instr.left;
                //match sharing: Be sure thread1 knows thread2 is using its matches.
                //thread.sharedMatches = true;
                const thread2 = new Thread(this.state!.maxThreadID, instr.right!, thread.priority + 1, thread.matches);
                this.enqueueThread(thread);
                this.enqueueThread(thread2);
                return;
            case "start":
                thread.pushMatchInstruction({
                    type: "start",
                    // +1 because the _current_ trace index just matched previously, so we don't want to include it in
                    // the match that starts with the _next_ character.
                    index: this.state!.index + 1,
                    group: instr.group,
                    groupIndex: instr.captureID
                });
                thread.pc++;
                this.enqueueThread(thread);
                return;
            case "end":
                thread.pushMatchInstruction({
                    type: "end",
                    // +1 for same reason as above.
                    index: this.state!.index + 1,
                    group: instr.group,
                    groupIndex: instr.captureID
                });
                thread.pc++;
                this.enqueueThread(thread);
                return;
            case "match":
                // Add matches to queue
                for (let i = 0; i < thread.matches.length; i++) {
                    if (thread.matches[i].priority >= thread.priority) {
                        // If it's a novel match...
                        if (this.state!.matchSet.push(thread.matches[i], true)) {
                            // Add it to the queue!
                            this.state!.matchQueue.push(thread.matches[i]);
                        }
                    }
                }
                //drop thread, its work is done
                thread.terminate();
                return;
            case "check":
                // check live set, then add to queue
                const hash = thread.hash();
                let state = this.state!;
                let live: ThreadState | undefined = state.liveSet.get(hash);
                if (!live) {
                    let threadList = new NonShrinkingArray<Thread>();
                    threadList.push(thread);
                    state.liveSet.push(hash, {
                        index: state.index,
                        threads: threadList
                    });
                } else if (live.index != state!.index) {
                    live.index = state.index;
                    live.threads.clear();
                    live.threads.push(thread);
                } else {
                    //maybe present
                    for (let i = 0; i < live.threads.length; i++) {
                        if (live.threads.get(i)!.equals(thread)) {
                            live.threads.get(i)!.mergeThread(thread);
                            // Drop the merged-in thread, no more work to do
                            thread.terminate();
                            return;
                        }
                    }
                }
                //not present: add stuck thread to queue.
                state.nextQueue.push(thread);
                return;
            //todo: case fork, join, joined-left, joined-right
            // joined-left and joined-right will need to handle merging!
            default:
                throw new Error("Unrecognized instruction type ${instr.type}");
        }
    }

    prettifyMatch(m: Match): PlayspecMatchResult<State> {
        let groups = [];
        let liveGroups: {
            [key: string]: GroupData<State>,
            [index: number]: GroupData<State>
        } = {};
        for (let i = 0; i < m.instructions.length; i++) {
            const instr = m.instructions[i];
            switch (instr.type) {
                case "start":
                    let newG: GroupData<State> = {
                        group: instr.group,
                        groupIndex: instr.groupIndex,
                        start: instr.index,
                        end: Infinity,
                        states: undefined,
                        results: undefined
                    };
                    if (this.config.preserveStates) {
                        newG.states = [];
                        newG.results = [];
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
                        //We'll only get here if we're preserving states; unless we reuse "state" for atomic element captures
                        continuedG.states!.push(instr.state);
                        continuedG.results!.push(instr.result);
                    }
                    break;
                case "end":
                    let finishedG = liveGroups[instr.group];
                    finishedG.end = instr.index;
                    delete liveGroups[instr.group];
                    break;
            }
        }
        let openGroups = Object.getOwnPropertyNames(liveGroups);
        if (openGroups.length) {
            throw new Error(`Open capture groups: ${openGroups.join(",")}`);
        }
        let rootGroup = groups.shift()!;
        let rootMatch: PlayspecMatchResult<State> = {
            start: rootGroup.start,
            end: rootGroup.end,
            //TODO: Ought empty captures to be dropped?
            subgroups: groups.filter(
                (group) => group.start != group.end
            ),
            states: undefined,
            results: undefined
        };
        if (this.config.preserveStates) {
            rootMatch.states = rootGroup.states;
            rootMatch.results = rootGroup.results;
        }
        return rootMatch;
    }

    next(): PlayspecResult<Trace, State> | null {
        if (!this.state) {
            throw new Error("Don't call next() on the same PlayspecResult twice!");
        }
        //Some kinds of trace aren't ready to start matching until some time goes by.
        if (this.config.spec.traceAPI.isReady &&
            !this.config.spec.traceAPI.isReady(this.state.trace)) {
            const nextState = this.state;
            this.state = undefined;
            return new PlayspecResult(this.config, nextState, undefined);
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
                let thread = this.state.queue.get(t)!;
                if (thread.priority < lastPriority) {
                    throw new Error("Decreasing priority!");
                }
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
                            if (thread.hasOpenMatch()) {
                                if (this.config.preserveStates &&
                                    (thread.hasExplicitMatch() ||
                                        this.config.preserveStates != "explicit")) {
                                    if (!copiedState) {
                                        copiedState = this.config.spec.traceAPI.copyCurrentState ?
                                            this.config.spec.traceAPI.copyCurrentState(this.state.trace) :
                                            state;
                                    }
                                    thread.pushMatchInstruction({
                                        type: "state",
                                        index: this.state.index,
                                        state: copiedState,
                                        result: checkResult
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
                if (!this.config.spec.traceAPI.isStreaming ||
                    !this.config.spec.traceAPI.isStreaming(this.state.trace)) {
                    this.state.queue.clear();
                }
                break;
            }
            this.config.spec.traceAPI.advanceState(this.state.trace);
            this.state.index++;
        }
        if (this.hasReadyMatch()) {
            // Also removes first match from queue!
            const match = this.state.matchQueue.shift()!;
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
        }
        if (this.config.spec.traceAPI.isStreaming &&
            this.config.spec.traceAPI.isStreaming(this.state.trace)) {
            const nextState = this.state;
            this.state = undefined;
            return new PlayspecResult(
                this.config,
                nextState,
                undefined
            )
        }
        // Otherwise, we're out of queue or trace and have nowhere to go
        this.state = undefined;
        return null;
    }
}
