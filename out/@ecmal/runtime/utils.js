System.register("@ecmal/runtime/utils", [], function (exporter, module, require, exports, __filename, __dirname) {
    "use strict";
    var __moduleName = module && module.id;
    var Utils;
    return {
        setters: [],
        execute: function () {
            Utils = (function () {
                function Utils() {
                }
                Utils.trace = function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    console.info.apply(console, args);
                };
                return Utils;
            }());
            exporter("Utils", Utils);
        }
    };
});
//# sourceMappingURL=utils.js.map