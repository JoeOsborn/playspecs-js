/* @flow */

export const tokenTypes:{ [key: string]: string } = {
    WHITESPACE: " ",
    CONCATENATION: ",",
    // Bounding integers are tokenized as part of the dots to minimize potential conflicts with user-provided syntax.
    DOTS_GREEDY: "...",
    DOTS_RELUCTANT: "..",
    DOTS_OMEGA: "***",
    LEFT_PAREN: "(",
    RIGHT_PAREN: ")",
    ALTERNATION: ";",
    INTERSECTION: "^",
    AND: "&",
    OR: "|",
    NOT: "not",
    START: "start",
    END: "end",
    ERROR: "error"
};

type MatchResult = Array < string >;

type TokenDefinition = Array < {
        type: string,
        match: string | Array < string > | RegExp,
        value? : ((mr:MatchResult) => any),
        tightness? : number,
        startParse? : ((p:Parser, t:Token) => ParseTree),
        extendParse? : ((p:Parser, pt:ParseTree, t:Token) => ParseTree)
    } >;

type Token = {
    type: string,
    value: any,
    range: {start: number, end: number},
    definition: TokenDefinition
};

type ParseTree = object;

type TokenStream = {
    tokens: Array < Token >,
    position: number,
    errors: Array < number >
};

export const standardTokens:Array<TokenSchema> = [
    {
        type: tokenTypes.WHITESPACE,
        match: /^\s+/
    },
    {
        type: tokenTypes.CONCATENATION,
        match: [tokenTypes.CONCATENATION]
    },
    {
        type: tokenTypes.DOTS_GREEDY,
        match: /^([0-9]*)\s*\.\.\.\s*([0-9]*)/
    },
    {
        type: tokenTypes.DOTS_RELUCTANT,
        match: /^([0-9]*)\s*\.\.\s*([0-9]*)/
    },
    {
        type: tokenTypes.DOTS_OMEGA,
        match: [tokenTypes.DOTS_OMEGA]
    },
    {
        type: tokenTypes.LEFT_PAREN,
        match: [tokenTypes.LEFT_PAREN]
    },
    {
        type: tokenTypes.RIGHT_PAREN,
        match: [tokenTypes.RIGHT_PAREN]
    },
    {
        type: tokenTypes.ALTERNATION,
        match: [tokenTypes.ALTERNATION]
    },
    {
        type: tokenTypes.INTERSECTION,
        match: [tokenTypes.INTERSECTION]
    },
    {
        type: tokenTypes.AND,
        match: [tokenTypes.AND]
    },
    {
        type: tokenTypes.OR,
        match: [tokenTypes.OR]
    },
    {
        type: tokenTypes.NOT,
        match: [tokenTypes.NOT]
    },
    {
        type: tokenTypes.START,
        match: [tokenTypes.START]
    },
    {
        type: tokenTypes.END,
        match: [tokenTypes.END]
    },
    {
        type: tokenTypes.ERROR,
        match: /^\S+/
    }
];

export class Parser {
    constructor(context) {
        this.tokenDefinitions = [];
        this.tokensByType = {};
        const tokens = (context.tokens || []).concat(standardTokens);
        for (let ti = 0; ti < tokens.length; ti++) {
            const input = tokens[ti];
            const defn = {
                type: input.type,
                match: input.match instanceof String ? [input.match] : input.match,
                value: input.value || function (mr) {
                    return mr[0];
                },
                tightness: input.tightness || 0,
                startParse: input.startParse || function (_parser, token) {
                    return token;
                },
                extendParse: input.extendParse || function (parser, token, parseTree) {
                    return parser.error("Can't extend a parse tree with a value type", token, parseTree);
                }
            };
            this.tokenDefinitions.push(defn);
            this.tokensByType[defn.type] = defn;
        }
    }

    tokenize(str:string):TokenStream {
        let result:Array<Token> = [];
        let errors:Array<number> = [];
        let substring:string = str;
        let index:number = 0;
        while (substring.length) {
            for (let ti = 0; ti < this.tokenDefinitions.length; ti++) {
                const tokenDefinition = this.tokenDefinitions[ti];
                const match = tokenDefinition.match;
                let matchResult = null;
                if (match instanceof RegExp) {
                    matchResult = match.exec(substring);
                } else if (Array.isArray(match)) {
                    for (let mi = 0; mi < match.length; mi++) {
                        const candidate = match[mi];
                        if (substring.substr(0, candidate.length) == candidate) {
                            matchResult = [candidate];
                            matchResult.index = 0;
                        }
                    }
                }
                if (matchResult && matchResult.index == 0) {
                    const matchLength = matchResult[0].length;
                    substring = substring.substr(matchResult[0].length);
                    const oldIndex = index;
                    index += matchLength;
                    if (tokenDefinition.type !== tokenTypes.WHITESPACE) {
                        if (tokenDefinition.type === tokenTypes.ERROR) {
                            errors.push(result.length);
                        }
                        result.push({
                            type: tokenDefinition.type,
                            value: tokenDefinition.value(matchResult),
                            range: {start: oldIndex, end: index},
                            definition: tokenDefinition
                        });
                    }
                    break;
                }
            }
        }
        return {tokens: result, position: 0, errors: errors};
    }
}