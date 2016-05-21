system.register("elp/cli", ['./cmd/init', './cmd/install', './cmd/compile', './cmd/publish', './cmd/validate', './cmd/status', './cmd/show', './cmd/fetch', './cmd/cache', './cmd/clone', './cmd/remotes', './cmd/bundle', './cmd/run', './cmd/command', './config', './services'], function(system,module) {
    var command_1, config_1, services_1;
    return {
        setters:[
            function (_1) {},
            function (_2) {},
            function (_3) {},
            function (_4) {},
            function (_5) {},
            function (_6) {},
            function (_7) {},
            function (_8) {},
            function (_9) {},
            function (_10) {},
            function (_11) {},
            function (_12) {},
            function (_13) {},
            function (command_1_1) {
                command_1 = command_1_1;
            },
            function (config_1_1) {
                config_1 = config_1_1;
            },
            function (services_1_1) {
                services_1 = services_1_1;
            }],
        execute: function() {
            config_1.default.load().then(function (config) {
                return services_1.default.load(config).then(function () {
                    return command_1.default('elp', '0.0.9');
                });
            }).catch(function (e) { return console.error(e.stack); });
        }
    }
});
//# sourceMappingURL=cli.js.map