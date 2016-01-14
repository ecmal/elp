export class GitIgnore {

    public include:RegExp[];
    public exclude:RegExp[];

    constructor(content){
        var parsed = parseContent(content);
        this.include = parsed[0];
        this.exclude = parsed[1];
    }
    accepts(input:string):boolean {
        if (input[0] === '/') input = input.slice(1);
        return this.exclude[0].test(input) || !this.include[0].test(input);
    }
    denies(input:string):boolean {
        if (input[0] === '/') input = input.slice(1);
        return !(this.exclude[0].test(input) || !this.include[0].test(input));
    }
    maybe(input:string):boolean {
        if (input[0] === '/') input = input.slice(1);
        return this.exclude[1].test(input) || !this.include[1].test(input);
    }
}

function parseContent(content) {
    return content.split('\n')
        .map(function (line) {
            line = line.trim();
            return line;
        })
        .filter(function (line) {
            return line && line[0] !== '#';
        })
        .reduce(function (lists, line) {
            var isNegative = line[0] === '!';
            if (isNegative) {
                line = line.slice(1);
            }
            if (line[0] === '/')
                line = line.slice(1);
            if (isNegative) {
                lists[1].push(line);
            }
            else {
                lists[0].push(line);
            }
            return lists;
        }, [[], []])
        .map(function (list) {
            return list
                .sort()
                .map(prepareRegexes)
                .reduce(function (list, prepared) {
                    list[0].push(prepared[0]);
                    list[1].push(prepared[1]);
                    return list;
                }, [[], [], []]);
        })
        .map(function (item) {
            return [
                item[0].length > 0 ? new RegExp('^((' + item[0].join(')|(') + '))') : new RegExp('$^'),
                item[1].length > 0 ? new RegExp('^((' + item[1].join(')|(') + '))') : new RegExp('$^')
            ]
        });
}

function prepareRegexes (pattern) {
    return [
        // exact regex
        prepareRegexPattern(pattern),
        // partial regex
        preparePartialRegex(pattern)
    ];
}

function prepareRegexPattern (pattern) {
    return escapeRegex(pattern).replace('**', '(.+)').replace('*', '([^\\/]+)');
}

function preparePartialRegex (pattern) {
    return pattern
        .split('/')
        .map(function (item, index) {
            if (index)
                return '([\\/]?(' + prepareRegexPattern(item) + '\\b|$))';
            else
                return '(' + prepareRegexPattern(item) + '\\b)';
        })
        .join('');
}

function escapeRegex (pattern) {
    return pattern.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, "\\$&");
}