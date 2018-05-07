export type MatchResult = Array<string>;

export type TokenDefinition = {
    type: string,
    match: string | Array<string> | RegExp,
    value?: ((mr: MatchResult) => any),
    tightness?: number,
    startParse?: ((p: IParser, t: Token) => ParseTree),
    extendParse?: ((p: IParser, pt: ParseTree, t: Token) => ParseTree)
};

export type Token = {
    type: string,
    value: any,
    // A bit redundant, but makes defining generic startParse/extendParse functions easier.
    tightness: number,
    range: { start: number, end: number }
};

export type ParseTree = {
    type: string,
    value: any,
    children: Array<ParseTree>,
    range: { start: number, end: number }
};


export interface IParser {
    error(msg: string, t: Token, pt?: ParseTree): ParseTree;
    node(type: string, value: boolean, children?: ParseTree[]): ParseTree;
    parseExpression(tightness: number): ParseTree;
    advance(): void;
    currentToken(): Token;
}

export type TraceAPI<Trace, State> = {
    isAtEnd: (t: Trace) => boolean,
    start: (t: Trace) => Trace,
    currentState: (t: Trace) => State,
    copyCurrentState?: (t: Trace) => State,
    isStreaming?: (t: Trace) => boolean,
    advanceState: (t: Trace) => void
}

export type PlayspecsContext<Trace, State> = {
    tokens: Array<TokenDefinition>,
    trace: TraceAPI<Trace, State>,
    checks: { [tokenType: string]: (t: Trace, s: State, idx: number, tokVal: any) => boolean }
}
