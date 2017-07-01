System.register("@vendor/sample/recursion/three", ["@ecmal/runtime", "./four", "./one"], function (exporter, module, require, exports, __filename, __dirname) {
    "use strict";
    var __moduleName = module && module.id;
    var runtime_1, four_1, one_1, Three;
    return {
        setters: [
            function (runtime_1_1) {
                runtime_1 = runtime_1_1;
            },
            function (four_1_1) {
                four_1 = four_1_1;
            },
            function (one_1_1) {
                one_1 = one_1_1;
            }
        ],
        execute: function () {
            console.info("execute three.js");
            Three = (function (_super) {
                runtime_1.__extends(Three, _super);
                function Three() {
                    return _super.call(this) || this;
                }
                Three.getOne = function () {
                    return Object.create(one_1.One.prototype);
                };
                Three.prototype.toString = function () {
                    this.one.toString();
                };
                return Three;
            }(four_1.Four));
            exporter("Three", Three);
        }
    };
});
//# sourceMappingURL=three.js.map