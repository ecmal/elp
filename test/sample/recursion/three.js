System.register("recursion/three", ["./four", "./one"], function (exporter, module, require, exports, __filename, __dirname) {
    "use strict";
    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var __moduleName = module && module.id;
    var four_1, one_1, Three;
    return {
        setters: [
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
                __extends(Three, _super);
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
