system.register("elp/models/registry", ["./url", '../config', "../utils/fs"], function(system,module) {
    var url_1, config_1, fs_1;
    var URL, ID, REGISTRIES;
    var Registry = (function (__super) {
        Registry.for = function (url) {
            var regs = this.all();
            for (var _i = 0, regs_1 = regs; _i < regs_1.length; _i++) {
                var reg = regs_1[_i];
                if (reg.matches(url)) {
                    return reg;
                }
            }
            return null;
        };
        Registry.all = function () {
            var _this = this;
            return Object.keys(REGISTRIES).map(function (k) { return _this.get(k); });
        };
        Registry.get = function (url) {
            var name;
            if (url instanceof url_1.Url) {
                name = url.registry;
            }
            else {
                name = url;
            }
            if (name && REGISTRIES[name]) {
                return (new REGISTRIES[name]());
            }
            else {
                throw new Error("Unknown registry '" + name + "' for module '" + url + "'");
            }
        };
        Registry.add = function (type) {
            REGISTRIES[type[ID]] = type;
        };
        Object.defineProperty(Registry.prototype, "id", {
            get: function () {
                return this.constructor[ID];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Registry.prototype, "options", {
            get: function () {
                return config_1.default.settings[this.id];
            },
            enumerable: true,
            configurable: true
        });
        Registry.prototype.remote = function (url) {
            return this.options.pattern
                .replace('%{vendor}', url.vendor)
                .replace('%{project}', url.project);
        };
        Registry.prototype.matches = function (url) {
            var u1 = URL.parse(url);
            var u2 = URL.parse(this.options.pattern);
            return u1.hostname == u2.hostname;
        };
        Registry.prototype.local = function (url) {
            return fs_1.default.resolve(config_1.default.home, 'registry', url.vendor, url.project);
        };
        Registry.prototype.toString = function () {
            return "Registry(" + this.id + "," + JSON.stringify(this.options, null, 2) + ")";
        };
        Registry.prototype.inspect = function () {
            return this.toString();
        };
        return Registry;
        function Registry() {
        }
    })();
    module.define('class', Registry);
    module.export("Registry", Registry);
    var GitRegistry = (function (__super) {
        GitRegistry.__initializer = function(__parent){
            __super=__parent;
        };
        return GitRegistry;
        function GitRegistry() {
            __super.apply(this, arguments);
        }
    })();
    module.define('class', GitRegistry);
    module.export("GitRegistry", GitRegistry);
    var BitbucketRegistry = (function (__super) {
        BitbucketRegistry.__initializer = function(__parent){
            __super=__parent;
            BitbucketRegistry[ID] = 'bitbucket';
        };
        return BitbucketRegistry;
        function BitbucketRegistry() {
            __super.apply(this, arguments);
        }
    })();
    module.define('class', BitbucketRegistry);
    module.export("BitbucketRegistry", BitbucketRegistry);
    var GithubRegistry = (function (__super) {
        GithubRegistry.__initializer = function(__parent){
            __super=__parent;
            GithubRegistry[ID] = 'github';
        };
        return GithubRegistry;
        function GithubRegistry() {
            __super.apply(this, arguments);
        }
    })();
    module.define('class', GithubRegistry);
    module.export("GithubRegistry", GithubRegistry);
    return {
        setters:[
            function (url_1_1) {
                url_1 = url_1_1;
            },
            function (config_1_1) {
                config_1 = config_1_1;
            },
            function (fs_1_1) {
                fs_1 = fs_1_1;
            }],
        execute: function() {
            URL = system.node.require('url');
            ID = Symbol('id');
            REGISTRIES = {};
            Registry = module.init(Registry);
            GitRegistry = module.init(GitRegistry,Registry);
            BitbucketRegistry = module.init(BitbucketRegistry,GitRegistry);
            GithubRegistry = module.init(GithubRegistry,GitRegistry);
        }
    }
});
//# sourceMappingURL=registry.js.map