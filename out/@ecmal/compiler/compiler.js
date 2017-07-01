System.register("@ecmal/compiler/compiler", ["@ecmal/runtime/utils"], function (exporter, module, require, exports, __filename, __dirname) {
    "use strict";
    var __moduleName = module && module.id;
    var utils_1, Compiler;
    return {
        setters: [
            function (utils_1_1) {
                utils_1 = utils_1_1;
            }
        ],
        execute: function () {
            Compiler = (function () {
                function Compiler() {
                    utils_1.Utils.trace("Hello");
                }
                return Compiler;
            }());
            exporter("Compiler", Compiler);
        }
    };
});
//# sourceMappingURL=compiler.js.map