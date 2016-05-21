system.register("elp/services", ["./config"], function(system,module) {
    var config_1;
    var Services = (function (__super) {
        Services.prototype.load = function (config) {
            return Promise.resolve(this);
        };
        return Services;
        function Services() {
        }
    })();
    module.define('class', Services);
    module.export("Services", Services);
    return {
        setters:[
            function (config_1_1) {
                config_1 = config_1_1;
            }],
        execute: function() {
            Services = module.init(Services);
            module.export("default",new Services());
        }
    }
});
//# sourceMappingURL=services.js.map