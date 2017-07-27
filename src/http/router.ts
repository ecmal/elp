const sepReg = /\|/
const multiSlashReg = /(\/){2,}/
const maybeRegex = /[?^{}()|[\]\\]/
const regexReg = /^([^\(\n\r\u2028\u2029]*)(\(.+\))$/
const parameterReg = /^(.*)(:\w+\b)(.*)$/
const escapeReg = /[.*+?^${}()|[\]\\]/g
const trimSlashReg = /(^\/)|(\/$)/g

export type RouteClass<T extends Route=Route> = {
    new (parentNode, frag, matchRemains?): T;
}

export class Route {
    public data: any;
    private state: RouteState<this>;
    public get isEndpoint() {
        return this.state.endpoint;
    }
    constructor(parentNode, frag, matchRemains = false) {
        Object.defineProperty(this, 'state', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: new RouteState(parentNode, frag, matchRemains)
        })
    }
    match(frags: string[], params: Dictionary, flags: string): this {
        let node = this;
        let frag = safeDecodeURIComponent(frags.shift())
        if (frag === false) {
            return null;
        }

        let childNodes = node.state.childNodes;
        let child = childNodes[flags ? frag.toLowerCase() : frag]
        if (child) return child

        let regexNodes = node.state.regexNodes

        for (let fragCopy, regexNode, i = 0, len = regexNodes.length; i < len; i++) {
            fragCopy = frag
            regexNode = regexNodes[i]

            if (regexNode.prefix) {
                if (fragCopy.indexOf(regexNode.prefix) !== 0) continue;
                fragCopy = fragCopy.slice(regexNode.prefix.length)
            }

            if (regexNode.regex && !regexNode.regex.test(fragCopy)) continue;
            if (regexNode.node.state.matchRemains) {
                while (frags.length) {
                    let remain = safeDecodeURIComponent(frags.shift())
                    if (remain === false) return null
                    fragCopy += '/' + remain
                }
            }
            if (regexNode.param) {
                params[regexNode.param] = fragCopy;
            }
            child = regexNode.node;
            break;
        }
        return child;
    }
    define(pattern: string, flags: string): this {
        let RouteType: RouteClass<this> = this.constructor as RouteClass<this>
        function checkMatchRegex(frag, prefix, parentNodeState) {
            let regexNode = parentNodeState.regexNames[prefix + ':^(.*)$']
            if (regexNode) {
                let pattern = parentNodeState.regexNodes[regexNode].node.state.pattern
                throw new Error('Can not define "' + frag + '" after "' + pattern + '".')
            }
        }
        function parseNode(parentNode: Route, frag: string, flags: string): Route {
            let res = null
            let regexs = '';
            let regex = null;
            let prefix = ''
            let parameter = ''
            let matchRemains = false
            let childNodes = parentNode.state.childNodes
            let regexNames = parentNode.state.regexNames
            let regexNodes = parentNode.state.regexNodes

            if (childNodes[frag]) return childNodes[frag]
            checkMatchRegex(frag, '', parentNode.state)

            if ((res = parameterReg.exec(frag))) {
                // case: `prefix:name(regex)`
                prefix = res[1]
                parameter = res[2].slice(1)
                regexs = res[3]
                if (regexs && !regexReg.test(regexs)) {
                    throw new Error('Can not parse "' + regexs + '" as regex pattern')
                }
            } else if ((res = regexReg.exec(frag))) {
                // case: `prefix(regex)`
                prefix = res[1]
                regexs = res[2]
            } else if (sepReg.test(frag)) {
                // case: `a|b|c`
                regexs = wrapSepExp(frag)
            } else if (maybeRegex.test(frag)) {
                throw new Error('Can not parse "' + frag + '"')
            } else {
                // case: other simple string node
                childNodes[frag] = new RouteType(parentNode, frag)
                return childNodes[frag]
            }

            if (regexs === '(*)') {
                regexs = '(.*)'
                matchRemains = true
            }

            if (regexs) {
                regexs = '^' + regexs + '$'
            }
            // normalize frag as regex node name
            let regexName = prefix + ':' + regexs
            // if regex node exist
            if (regexNames[regexName]) {
                return regexNodes[regexNames[regexName]].node;
            }

            if (prefix) {
                checkMatchRegex(frag, prefix, parentNode.state)
            }
            let node = new RouteType(parentNode, regexName, matchRemains)
            if (regexs) {
                regex = new RegExp(regexs, flags)
            }
            regexNames[regexName] = '' + regexNodes.length
            regexNodes.push(new RouteRegex<Route>(node, prefix, parameter, regex))
            return node;
        }
        function defineChild(parentNode: Route, frags: string[], flags: string): Route {
            let frag = frags.shift()
            let child = parseNode(parentNode, frag, flags)
            if (!frags.length) {
                child.state.endpoint = true
                return child
            }
            if (child.state.matchRemains) {
                throw new Error('Can not define regex pattern after "(*)" pattern.')
            }
            return defineChild(child, frags, flags)
        }
        let _pattern = pattern.replace(trimSlashReg, '');
        let node = defineChild(this, _pattern.split('/'), flags);
        if (node.state.pattern == null) {
            node.state.pattern = pattern;
        }
        return node as this;
    }
    get pattern(){
        return this.state.pattern;
    }
    get params(){
        let list = [];
        if(this.state.parentNode){
            list = this.state.parentNode.params
        }
        if(this.state.regexNodes.length){
            list = list.concat(this.state.regexNodes.map(n=>n.param))
        }
        return list;
    }
    inspect():any{
        return `Route(${this.state.pattern},[${this.params.join()}])`;
    }
   
}

export class RouteState<T extends Route> {

    public name: string;
    public pattern: string;
    public endpoint: boolean;
    public parentNode: T;
    public matchRemains: boolean;
    public childNodes: Dictionary<T>;
    public regexNames: Dictionary<string>;
    public regexNodes: Array<RouteRegex<T>>;

    constructor(parentNode, frag, matchRemains) {
        this.name = frag;
        this.pattern = null;
        this.endpoint = false;
        this.parentNode = parentNode;
        this.matchRemains = !!matchRemains;
        this.childNodes = Object.create(null);
        this.regexNames = Object.create(null);
        this.regexNodes = [];
        Object.defineProperty(this,'parentNode',{
            writable    : true,
            value       : this.parentNode
        })
        Object.defineProperty(this,'childNodes',{
            writable    : true,
            value       : this.childNodes
        })
    }

}

export class RouteRegex<T extends Route> {

    public node: T;
    public prefix: string;
    public param: string;
    public regex: RegExp;

    constructor(node, prefix, param, regex) {
        this.node = node
        this.prefix = prefix || ''
        this.param = param || ''
        this.regex = regex || null
    }

}

export class Match<T extends Route> {
    public node: T;
    public nodes: T[];
    public params: Dictionary;
    constructor() {
        this.node = null;
        this.nodes = [];
        this.params = {};
    }
}

export class Router<T extends Route=Route> {
    public root: T;
    public flags: string;
    public nodes: Dictionary<T>;
    public type: RouteClass<T>;
    constructor(RouteType: RouteClass<T>, ignoreCase?: boolean) {
        this.type = RouteType;
        this.flags = ignoreCase ? 'i' : '';
        this.root = new RouteType(null, 'root', null)
        this.nodes = Object.create(null);
    }
    public define(pattern: string): T {
        if (typeof pattern !== 'string') {
            throw new TypeError('Pattern must be string.');
        }
        if (multiSlashReg.test(pattern)) {
            throw new Error('Multi-slash exist.');
        }
        if (!(this.nodes[pattern] instanceof Route)) {
            this.nodes[pattern] = this.root.define(pattern, this.flags);
        }
        return this.nodes[pattern];
    }
    public match(path, multiMatch?): Match<T> {
        // the path should be normalized before match, just as path.normalize do in Node.js
        if (typeof path !== 'string') {
            throw new TypeError('Path must be string.')
        }
        path = path.replace(trimSlashReg, '');

        let node = this.root
        let frags = path.split('/')
        let matched = new Match<T>()

        while (frags.length) {
            node = node.match(frags, matched.params, this.flags)
            // matched
            if (node) {
                if (multiMatch && node.isEndpoint) {
                    matched.nodes.push(node)
                }
                continue;
            }
            // not match
            return multiMatch ? matched : null
        }
        matched.node = node
        if (!multiMatch && !node.isEndpoint) {
            return null;
        }
        return matched;
    }
    public print() {
        console.info(this.nodes);
    }
}
function safeDecodeURIComponent(string) {
    try {
        return decodeURIComponent(string)
    } catch (err) {
        return false
    }
}
function wrapSepExp(str) {
    let res = str.split('|')
    for (let i = 0, len = res.length; i < len; i++) {
        if (!res[i]) throw new Error('Can not parse "' + str + '" as separated pattern')
        res[i] = res[i].replace(escapeReg, '\\$&')
    }
    return '(' + res.join('|') + ')'
}