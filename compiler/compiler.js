system.register("elp/compiler/compiler", ["../models/project", "../models/source", "compiler/index", "../utils/fs"], function(system,module) {
    var project_1, source_1, index_1, fs_1;
    var Compiler = (function (__super) {
        Compiler.prototype.fileExists = function (fileName) {
            console.info('CompilerHost.fileExists');
            return false;
        };
        Compiler.prototype.readFile = function (fileName) {
            console.info('CompilerHost.readFile');
            return null;
        };
        Compiler.prototype.getSourceFile = function (fileName, target, onError) {
            var _this = this;
            var uri = source_1.Source.getName(fileName);
            if (fileName == '$.d.ts') {
                var definitions = [], defs = [];
                Object.keys(this.sources).forEach(function (s) {
                    var source = _this.sources[s];
                    if (source.name == 'package' && source.tsd && source.tsd.content &&
                        !(_this.project.bundle && source.project == _this.project.name)) {
                        defs.push(source.project + "/" + source.name + ".d.ts");
                        definitions.push("//" + source.project + "/package.d.ts");
                        definitions.push(source.tsd.content.toString());
                    }
                });
                //console.info(defs);
                return index_1.default.createSourceFile(fileName, definitions.join('\n'), target);
            }
            else {
                var source = this.sources[uri];
                if (source) {
                    //console.info(fileName);
                    return index_1.default.createSourceFile(fileName, source.content, target);
                }
            }
        };
        Compiler.prototype.getDefaultLibFileName = function (options) {
            return "$.d.ts";
        };
        Compiler.prototype.writeFile = function (fileName, data, writeByteOrderMark, onError) {
            var _this = this;
            fileName = fileName.replace('./', '');
            if (fileName.indexOf(this.project.name + '/') == 0) {
                fileName = fileName.replace(this.project.name + '/', '');
            }
            var name = source_1.Source.getName(fileName);
            var ext = source_1.Source.getExt(fileName);
            var source = this.project.sources[name];
            if (!source) {
                source = this.project.sources[name] = new source_1.Source(this.project.name, name, true);
            }
            if (ext == '.js.map') {
                try {
                    var map = JSON.parse(data);
                    map.sourceRoot = source.dirname || this.project.sourceDir;
                    //delete map.sourceRoot;
                    if (map.sources.length > 0) {
                        map.sources = map.sources.map(function (n) {
                            var name = source_1.Source.getName(n);
                            var ext = source_1.Source.getExt(n);
                            var src = _this.sources[name];
                            if (src) {
                                return src.name + ext;
                            }
                            else {
                                return n;
                            }
                        });
                    }
                    data = JSON.stringify(map, null, 2);
                }
                catch (e) {
                    console.info(e.stack);
                    console.info(fileName, ext);
                    console.info(data);
                }
            }
            source.addFile({
                name: name,
                ext: ext,
                content: new Buffer(data)
            });
        };
        Compiler.prototype.getCurrentDirectory = function () {
            return '.';
        };
        Compiler.prototype.getCanonicalFileName = function (fileName) {
            return fileName;
        };
        Compiler.prototype.useCaseSensitiveFileNames = function () {
            return true;
        };
        Compiler.prototype.getNewLine = function () {
            return '\n';
        };
        Compiler.prototype.resolveModuleName = function (dirName, modName) {
            modName = modName.replace(/(\.d)?\.(ts|js)$/, '');
            modName = fs_1.default.resolve('/' + dirName, modName).substr(1);
            var src = this.sources[modName];
            if (src) {
                if (src.ts) {
                    modName = modName + '.ts';
                }
                else if (src.tsx) {
                    modName = modName + '.tsx';
                }
                else if (src.tsd) {
                    modName = modName + '.d.ts';
                }
            }
            return modName;
        };
        Compiler.prototype.resolveModuleNames = function (moduleNames, containingFile) {
            var _this = this;
            var containingDir = fs_1.default.dirname(containingFile);
            return moduleNames.map(function (moduleName) {
                var isRelative = moduleName[0] == '.';
                var isExternalLibraryImport = containingDir.indexOf(_this.project.name) != 0;
                var resolvedFileName;
                if (isRelative) {
                    resolvedFileName = _this.resolveModuleName(containingDir, moduleName);
                }
                else {
                    resolvedFileName = _this.resolveModuleName('', moduleName);
                }
                return {
                    resolvedFileName: resolvedFileName,
                    isExternalLibraryImport: isExternalLibraryImport
                };
            });
        };
        Object.defineProperty(Compiler.prototype, "options", {
            get: function () {
                var modFormat = index_1.default.ModuleKind.System;
                if (this.project.format) {
                    switch (this.project.format.toUpperCase()) {
                        case 'AMD':
                            modFormat = index_1.default.ModuleKind.AMD;
                            break;
                        case 'COMMONJS':
                            modFormat = index_1.default.ModuleKind.CommonJS;
                            break;
                        case 'ES6':
                            modFormat = index_1.default.ModuleKind.ES6;
                            break;
                        case 'ES2015':
                            modFormat = index_1.default.ModuleKind.ES2015;
                            break;
                        case 'NONE':
                            modFormat = index_1.default.ModuleKind.None;
                            break;
                        case 'SYSTEM':
                            modFormat = index_1.default.ModuleKind.System;
                            break;
                        case 'UMD':
                            modFormat = index_1.default.ModuleKind.UMD;
                            break;
                    }
                }
                var modTarget = index_1.default.ScriptTarget.ES5;
                if (this.project.target) {
                    switch (this.project.target.toUpperCase()) {
                        case 'ES3':
                            modTarget = index_1.default.ScriptTarget.ES3;
                            break;
                        case 'ES5':
                            modTarget = index_1.default.ScriptTarget.ES5;
                            break;
                        case 'ES6':
                            modTarget = index_1.default.ScriptTarget.ES6;
                            break;
                        case 'ES2015':
                            modTarget = index_1.default.ScriptTarget.ES2015;
                            break;
                        case 'Latest':
                            modTarget = index_1.default.ScriptTarget.Latest;
                            break;
                    }
                }
                if (this.project.bundle) {
                    console.info(this.project.name + "/" + this.project.bundle);
                }
                return {
                    jsx: index_1.default.JsxEmit.React,
                    reactNamespace: 'Reflect',
                    experimentalDecorators: true,
                    emitDecoratorMetadata: true,
                    module: modFormat,
                    target: modTarget,
                    stripInternal: true,
                    declaration: true,
                    outDir: ".",
                    rootDir: ".",
                    sourceMap: true,
                    inlineSources: true,
                    noLib: this.project.core != 'core',
                    outFile: this.project.bundle ? this.project.name + "/" + this.project.bundle : undefined
                };
            },
            enumerable: true,
            configurable: true
        });
        Compiler.prototype.compile = function () {
            var _this = this;
            this.sources = {};
            this.project.sourcesAll.forEach(function (s) {
                _this.sources[s.uri] = s;
            });
            var sources = this.project.sourcesSelf.filter(function (s) { return s.ts || s.tsx; }).map(function (s) { return s.uri + (s.tsx ? '.tsx' : (s.ts ? '.ts' : '.d.ts')); });
            this.program = index_1.default.createProgram(sources, this.options, this, this.program);
            var diagnostics = [];
            var result = this.program.emit();
            this.program.getSourceFiles().forEach(function (s) {
                var d = [];
                d = d.concat(_this.program.getSyntacticDiagnostics(s) || []);
                d = d.concat(_this.program.getDeclarationDiagnostics(s) || []);
                d = d.concat(_this.program.getSemanticDiagnostics(s) || []);
                if (d.length) {
                    diagnostics = diagnostics.concat(d);
                }
            });
            diagnostics = diagnostics.concat(this.program.getGlobalDiagnostics());
            diagnostics = diagnostics.concat(this.program.getOptionsDiagnostics());
            if (result.diagnostics && result.diagnostics.length) {
                diagnostics = diagnostics.concat(result.diagnostics);
            }
            diagnostics = diagnostics.filter(function (d) { return (d && d.code != 1166); }).sort(function (a, b) {
                if (a.file && b.file) {
                    return a.file.fileName == b.file.fileName ? 0 : (a.file.fileName > b.file.fileName ? 1 : -1);
                }
                else {
                    return 0;
                }
            });
            if (diagnostics.length > 0) {
                var len = Math.min(10, diagnostics.length);
                for (var dk = 0; dk < len; dk++) {
                    var d = diagnostics[dk];
                    var category = '';
                    switch (d.category) {
                        case index_1.default.DiagnosticCategory.Error:
                            category = 'Error';
                            break;
                        case index_1.default.DiagnosticCategory.Warning:
                            category = 'Warning';
                            break;
                        case index_1.default.DiagnosticCategory.Message:
                            category = 'Message';
                            break;
                    }
                    var file = ' - ';
                    if (d.file) {
                        var _a = d.file.getLineAndCharacterOfPosition(d.start), line = _a.line, character = _a.character;
                        file = " '" + d.file.fileName + ":" + (line + 1) + ":" + (character + 1) + "' - ";
                    }
                    var message = index_1.default.flattenDiagnosticMessageText(d.messageText, '\n  ');
                    console.info("  " + category + " " + d.code + file + message);
                }
                if (diagnostics.length > len) {
                    console.info("  ... " + (diagnostics.length - len) + " more");
                }
            }
            return diagnostics;
        };
        return Compiler;
        function Compiler(project) {
            this.project = project;
            this.program = null;
            this.sources = {};
        }
    })();
    module.define('class', Compiler);
    module.export("Compiler", Compiler);
    return {
        setters:[
            function (project_1_1) {
                project_1 = project_1_1;
            },
            function (source_1_1) {
                source_1 = source_1_1;
            },
            function (index_1_1) {
                index_1 = index_1_1;
            },
            function (fs_1_1) {
                fs_1 = fs_1_1;
            }],
        execute: function() {
            Compiler = module.init(Compiler);
        }
    }
});
//# sourceMappingURL=compiler.js.map