system.register("elp/utils/gitignore", [], function(system,module) {
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
            ];
        });
    }
    module.define('function', parseContent)
    function prepareRegexes(pattern) {
        return [
            // exact regex
            prepareRegexPattern(pattern),
            // partial regex
            preparePartialRegex(pattern)
        ];
    }
    module.define('function', prepareRegexes)
    function prepareRegexPattern(pattern) {
        return escapeRegex(pattern).replace('**', '(.+)').replace('*', '([^\\/]+)');
    }
    module.define('function', prepareRegexPattern)
    function preparePartialRegex(pattern) {
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
    module.define('function', preparePartialRegex)
    function escapeRegex(pattern) {
        return pattern.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, "\\$&");
    }
    module.define('function', escapeRegex)
    var GitIgnore = (function (__super) {
        GitIgnore.prototype.accepts = function (input) {
            if (input[0] === '/')
                input = input.slice(1);
            return this.exclude[0].test(input) || !this.include[0].test(input);
        };
        GitIgnore.prototype.denies = function (input) {
            if (input[0] === '/')
                input = input.slice(1);
            return !(this.exclude[0].test(input) || !this.include[0].test(input));
        };
        GitIgnore.prototype.maybe = function (input) {
            if (input[0] === '/')
                input = input.slice(1);
            return this.exclude[1].test(input) || !this.include[1].test(input);
        };
        return GitIgnore;
        function GitIgnore(content) {
            var parsed = parseContent(content);
            this.include = parsed[0];
            this.exclude = parsed[1];
        }
    })();
    module.define('class', GitIgnore);
    module.export("GitIgnore", GitIgnore);
    return {
        setters:[],
        execute: function() {
            GitIgnore = module.init(GitIgnore);
        }
    }
});
//# sourceMappingURL=gitignore.js.map