system.register("elp/config", ['./utils/fs', "./models/registry"], function(system,module) {
    var fs_1, registry_1, registry_2, registry_3;
    var process;
    var Config = (function (__super) {
        Config.prototype.checkHome = function () {
            if (!fs_1.default.isDir(this.home)) {
                fs_1.default.createDir(this.home);
            }
        };
        Config.prototype.checkConfig = function () {
            if (!fs_1.default.isFile(this.config)) {
                fs_1.default.writeJson(this.config, this.settings);
            }
            else {
                this.settings = fs_1.default.readJson(this.config);
            }
        };
        Config.prototype.checkRegistries = function () {
            registry_1.Registry.add(registry_2.BitbucketRegistry);
            registry_1.Registry.add(registry_3.GithubRegistry);
        };
        Config.prototype.checkPlugins = function () { };
        Config.prototype.load = function () {
            this.checkHome();
            this.checkConfig();
            this.checkPlugins();
            this.checkRegistries();
            return Promise.resolve(this);
        };
        return Config;
        function Config() {
            this.env = {
                home: process.env.HOME,
                path: process.env.PATH
            };
            this.settings = {
                username: "none",
                password: "none",
                github: {
                    url: "https://github.com",
                    pattern: "https://github.com/%{vendor}/%{project}.git",
                    username: "none",
                    password: "none"
                },
                bitbucket: {
                    url: "https://bitbucket.org",
                    pattern: "https://bitbucket.org/%{vendor}/%{project}.git",
                    username: "none",
                    password: "none"
                }
            };
            this.name = 'elp';
            this.home = fs_1.default.resolve(this.env.home, '.' + this.name);
            this.config = fs_1.default.resolve(this.home, 'config.json');
            this.dirname = system.node.dirname;
            this.filename = system.node.filename;
        }
    })();
    module.define('class', Config);
    module.export("Config", Config);
    return {
        setters:[
            function (fs_1_1) {
                fs_1 = fs_1_1;
            },
            function (registry_1_1) {
                registry_1 = registry_1_1;
                registry_2 = registry_1_1;
                registry_3 = registry_1_1;
            }],
        execute: function() {
            process = system.node.process;
            Config = module.init(Config);
            module.export("default",new Config());
        }
    }
});
//# sourceMappingURL=config.js.map