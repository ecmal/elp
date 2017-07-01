System.register("@vendor/sample/recursion/one", ["@ecmal/runtime", "./three"], function (exporter, module, require, exports, __filename, __dirname) {
    "use strict";
    var __moduleName = module && module.id;
    var runtime_1, three_1, One;
    return {
        setters: [
            function (runtime_1_1) {
                runtime_1 = runtime_1_1;
            },
            function (three_1_1) {
                three_1 = three_1_1;
            }
        ],
        execute: function () {
            console.info("execute one.js");
            One = (function (_super) {
                runtime_1.__extends(One, _super);
                function One() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                return One;
            }(three_1.Three));
            exporter("One", One);
        }
    };
});
//# sourceMappingURL=one.js.map