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
    TRUE: "true",
    FALSE: "false",
    ERROR: "error"
};

export const parseTypes:{ [key: string]: string } = {
    OMEGA: tokenTypes.OMEGA,
    REPETITION: tokenTypes.DOTS_GREEDY,
    CONCATENATION: tokenTypes.CONCATENATION,
    GROUP: tokenTypes.LEFT_PAREN,
    ALTERNATION: tokenTypes.ALTERNATION,
    INTERSECTION: tokenTypes.INTERSECTION,
    AND: tokenTypes.AND,
    OR: tokenTypes.OR,
    NOT: tokenTypes.NOT,
    START: tokenTypes.START,
    END: tokenTypes.END,
    TRUE: tokenTypes.TRUE,
    FALSE: tokenTypes.FALSE,
    ERROR: tokenTypes.ERROR
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
    // A bit redundant, but makes defining generic startParse/extendParse functions easier.
    tightness: number,
    range: {start: number, end: number}
};

type ParseTree = {
    type: string,
    value: any,
    children: Array < ParseTree >,
    range: {start: number, end: number}
};

type TokenStream = {
    string: string,
    tokens: Array < Token >,
    position: number,
    errors: Array < number >
};

export const constantValue = function(c:any) {
    return function(_mr:MatchResult) { return c; }
};

export const parseValue = function (parser:Parser, token:Token) {
    return parser.node(token.type, token.value);
};

export const parseInfixR = function (parser:Parser, left:ParseTree, token:Token) {
    let children = [left];
    children.push(parser.parseExpression(token.tightness-1));
    return parser.node(token.type, token.value, children);
};

export const parseInfixRPropositional = function (parser:Parser, left:ParseTree, token:Token) {
    if (!parser.isPropositional(left)) {
        return parser.error("Left hand side of token must be propositional", token, left);
    }
    let children = [left];
    const right = parser.parseExpression(token.tightness-1);
    if (!parser.isPropositional(right)) {
        return parser.error("Right hand side of token must be propositional", token, right);
    }
    children.push(right);
    return parser.node(token.type, token.value, children);
};

const BOUND_INFINITE = "$END";

export const standardTokens:Array<TokenSchema> = [
    {
        type: tokenTypes.WHITESPACE,
        match: /^\s+/
    },
    {
        type: tokenTypes.CONCATENATION,
        match: [tokenTypes.CONCATENATION],
        tightness: 100,
        extendParse: parseInfixR
    },
    {
        type: tokenTypes.DOTS_GREEDY,
        match: /^([0-9]*)\s*\.\.\.\s*([0-9]*)/,
        value: function (matchResult:MatchResult):any {
            return {
                greedy: true,
                lowerBound: matchResult[1] ? parseInt(matchResult[1]) : 0,
                upperBound: matchResult[2] ? parseInt(matchResult[2]) : BOUND_INFINITE
            };
        },
        tightness: 110,
        startParse: function(parser:Parser, token:Token):ParseTree {
            return parser.node(parseTypes.REPETITION, token.value, [parser.node(parseTypes.TRUE, true)]);
        },
        extendParse: function (parser:Parser, left:ParseTree, token:Token):ParseTree {
            //TODO: Handle parse errors
            return parser.node(parseTypes.REPETITION, token.value, [left]);
        }
    },
    {
        type: tokenTypes.DOTS_RELUCTANT,
        match: /^([0-9]*)\s*\.\.\s*([0-9]*)/,
        tightness: 110,
        value: function (matchResult:MatchResult) {
            return {
                greedy: false,
                lowerBound: matchResult[1] ? parseInt(matchResult[1]) : 0,
                upperBound: matchResult[2] ? parseInt(matchResult[2]) : BOUND_INFINITE
            };
        },
        startParse: function(parser:Parser, token:Token):ParseTree {
            return parser.node(parseTypes.REPETITION, token.value, [parser.node(parseTypes.TRUE, true)]);
        },
        extendParse: function (parser:Parser, left:ParseTree, token:Token):ParseTree {
            //TODO: Handle parse errors
            return parser.node(parseTypes.REPETITION, token.value, [left]);
        }
    },
    {
        type: tokenTypes.DOTS_OMEGA,
        match: [tokenTypes.DOTS_OMEGA],
        tightness: 110,
        startParse: function(parser:Parser, token:Token):ParseTree {
            return parser.node(parseTypes.OMEGA, token.value, [parser.node(parseTypes.TRUE, true)]);
        },
        extendParse: function (parser:Parser, left:ParseTree, token:Token):ParseTree {
            //TODO: Handle parse errors
            return parser.node(parseTypes.OMEGA, token.value, [left]);
        }
    },
    {
        type: tokenTypes.LEFT_PAREN,
        match: [tokenTypes.LEFT_PAREN],
        startParse: function (parser:Parser, token:Token):ParseTree {
            //parse an expression at RBP 0, then eat a )
            const expr = parser.parseExpression(0);
            if(parser.currentToken().type != tokenTypes.RIGHT_PAREN) {
                return parser.error("Missing right parenthesis", token, expr);
            }
            return parser.node(token.type, token.value, [expr]);
        }
    },
    {
        type: tokenTypes.RIGHT_PAREN,
        match: [tokenTypes.RIGHT_PAREN]
    },
    {
        type: tokenTypes.ALTERNATION,
        match: [tokenTypes.ALTERNATION],
        tightness: 60,
        extendParse: parseInfixR
    },
    {
        type: tokenTypes.INTERSECTION,
        match: [tokenTypes.INTERSECTION],
        tightness: 50,
        extendParse: parseInfixR
    },
    {
        type: tokenTypes.AND,
        match: [tokenTypes.AND],
        tightness: 200,
        extendParse: parseInfixRPropositional
    },
    {
        type: tokenTypes.OR,
        match: [tokenTypes.OR],
        tightness: 210,
        extendParse: parseInfixRPropositional
    },
    {
        type: tokenTypes.NOT,
        match: [tokenTypes.NOT],
        tightness: 220,
        startParse: function (parser:Parser, token:Token):ParseTree {
            const phi = parser.parseExpression(token.tightness);
            if (!parser.isPropositional(phi)) {
                return parser.error("NOT may only negate propositional state formulae", token, phi);
            }
            return parser.node(token.type, token.value, [phi]);
        }
    },
    {
        type: tokenTypes.START,
        match: [tokenTypes.START],
        startParse: parseValue
    },
    {
        type: tokenTypes.END,
        match: [tokenTypes.END],
        startParse: parseValue
    },
    {
        type: tokenTypes.TRUE,
        match: [tokenTypes.TRUE],
        value: constantValue(true),
        startParse: parseValue
    },
    {
        type: tokenTypes.FALSE,
        match: [tokenTypes.FALSE],
        value: constantValue(false),
        startParse: parseValue
    },
    {
        type: tokenTypes.ERROR,
        match: /^\S+/,
        startParse: parseValue
    }
];

const customTightnessOffset = 300;

const ERROR = "ERROR";

function isString(s:any):bool {
    return typeof s === 'string' || s instanceof String;
}

export class Parser {
    constructor(context) {
        this.tokenDefinitions = [];
        this.tokensByType = {};
        this.parseErrors = [];
        const customTokens = context.tokens || [];
        const tokens = customTokens.concat(standardTokens);
        for (let ti = 0; ti < tokens.length; ti++) {
            const input = tokens[ti];
            const tightness = input.tightness || 0;
            const defn = {
                type: input.type,
                match: isString(input.match) ? [input.match] : input.match,
                value: input.value || function (mr) {
                    return mr[0];
                },
                tightness: ti < customTokens.length ? tightness+customTightnessOffset : tightness,
                startParse: input.startParse || function (parser, token) {
                    return parser.error("Can't start a parse tree with this token", token);
                },
                extendParse: input.extendParse || function (parser, token, parseTree) {
                    return parser.error("Can't extend a parse tree with this token", token, parseTree);
                }
            };
            this.tokenDefinitions.push(defn);
            this.tokensByType[defn.type] = defn;
        }
        this.resetStream();
    }

    node(type:string, value:any = undefined, children:Array<ParseTree> = []):ParseTree {
        return {type, value, children, range: {start: -1, end: -1}};
    }

    error(msg:string, token:Token, tree:ParseTree = undefined):ParseTree {
        const err = this.node(ERROR, {message: msg, token, tree});
        this.parseErrors.push(err);
        return err;
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
                            tightness: tokenDefinition.tightness,
                            range: {start: oldIndex, end: index}
                        });
                    }
                    break;
                }
            }
        }
        return {string: str, tokens: result, position: 0, errors: errors};
    }

    isCustom(p:ParseTree):bool {
        return !(p.type in parseTypes);
    }

    isPropositional(p:ParseTree):bool {
        return this.isCustom(p) ||
            p.type == parseTypes.AND ||
            p.type == parseTypes.OR ||
            p.type == parseTypes.NOT ||
            p.type == parseTypes.START ||
            p.type == parseTypes.END ||
            (p.type == parseTypes.GROUP &&
             p.children.every(function(c) {
                 return this.isPropositional(c);
             }));
    }

    resetStream():void {
        this.stream = {string: "", tokens: [], position: 0, errors: []};
    }

    charPosition():number {
        return this.currentToken() ? this.currentToken().range.start : this.stream.string.length;
    }

    remainder():string {
        const end = this.charPosition();
        return this.stream.string.substr(end);
    }

    currentToken():Token {
        return this.stream.tokens[this.stream.position];
    }

    advance():void {
        this.stream.position++;
    }

    parse(str:string):{tree:ParseTree, errors:Array<ParseTree>, remainder:string} {
        this.stream = this.tokenize(str);
        this.parseErrors = [];
        const tree = this.parseExpression(0);
        var result = {tree, errors: this.parseErrors, remainder: this.remainder()};
        this.parseErrors = [];
        this.resetStream();
        return result;
    }

    parseExpression(tightness:number):ParseTree {
        let token = this.currentToken();
        let tokenDef = this.tokensByType[token.type];
        const start = token.range.start;
        console.log("parse token "+token.type);
        this.advance();
        let tree = tokenDef.startParse(this, token);
        console.log("Parsed unit "+tree.type);
        tree.range.start = start;
        tree.range.end = this.charPosition();
        if (tree.type == ERROR) {
            return tree;
        }
        token = this.currentToken();
        while (token && tightness < token.tightness) {
            tokenDef = this.tokensByType[token.type];
            this.advance();
            console.log("Extend "+tree.type+" using "+token.type);
            let newTree = tokenDef.extendParse(this, tree, token);
            console.log("Got "+newTree.type);
            newTree.range.start = tree.range.start;
            newTree.range.end = this.charPosition();
            if (newTree.type == ERROR) {
                return newTree;
            }
            tree = newTree;
            token = this.currentToken();
        }
        return tree;
    }

}