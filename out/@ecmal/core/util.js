System.register("@ecmal/core/util", ["@ecmal/runtime"], function (exporter, module, require, exports, __filename, __dirname) {
    "use strict";
    var __moduleName = module && module.id;
    var runtime_1, Utils;
    return {
        setters: [
            function (runtime_1_1) {
                runtime_1 = runtime_1_1;
            }
        ],
        execute: function () {
            Utils = (function () {
                function Utils() {
                }
                Utils.me = runtime_1.default;
                return Utils;
            }());
            exporter("Utils", Utils);
        }
    };
});
//# sourceMappingURL=util.js.map