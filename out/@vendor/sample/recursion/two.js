System.register("@vendor/sample/recursion/two", ["@ecmal/runtime", "./five"], function (exporter, module, require, exports, __filename, __dirname) {
    "use strict";
    var __moduleName = module && module.id;
    var runtime_1, five_1, Two;
    return {
        setters: [
            function (runtime_1_1) {
                runtime_1 = runtime_1_1;
            },
            function (five_1_1) {
                five_1 = five_1_1;
            }
        ],
        execute: function () {
            console.info("execute two.js");
            Two = (function (_super) {
                runtime_1.__extends(Two, _super);
                function Two() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                Two.getTwo = function () {
                    return new Two();
                };
                return Two;
            }(five_1.Five));
            exporter("Two", Two);
        }
    };
});
//# sourceMappingURL=two.js.map