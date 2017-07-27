/// <reference types="typescript/lib/typescriptServices" />

declare const Buffer;
namespace ts {
    export function override<T extends Function>(value: T): T {
        let parent = ts[value.name];
        ts[value.name] = value;
        return parent;
    }
}

namespace ts {
    
    ts['externalHelpersModuleNameText'] = "@ecmal/runtime"
    ts['optionDeclarations'].push({
        name: "name",
        type: "string",
        shortName: "n",
        category: ts['Diagnostics'].Command_line_Options,
        description: {
            category: ts.DiagnosticCategory.Message,
            key: "Project_name",
            code: 20001,
            message: "Project Name"
        }
    });
    export interface CompilerOptions {
        name?: string;
    }


    let exporterId = ts.createIdentifier("exporter");
    let contextId = ts.createIdentifier("module");
    let requireId = ts.createIdentifier("require");
    let exportsId = ts.createIdentifier("exports");
    let runtimeId = ts.createIdentifier("runtime");
    let filenameId = ts.createIdentifier("__filename");
    let dirnameId = ts.createIdentifier("__dirname");

    let superGetResolvedExternalModuleName = ts.override(getResolvedExternalModuleName);
    let superGetExternalModuleNameFromPath = ts.override(getExternalModuleNameFromPath);
    let superCreateUniqueName = ts.override(createUniqueName);
    let superTryGetModuleNameFromFile = ts.override(tryGetModuleNameFromFile);
    let superCreateFunctionExpression = ts.override(createFunctionExpression);
    let superParseJsonSourceFileConfigFileContent = ts.override(parseJsonSourceFileConfigFileContent);
    let superCreateSourceFile = ts.override(createSourceFile);
    let superGetSupportedExtensions = ts.override(getSupportedExtensions);
    let superResolveModuleName = ts.override(resolveModuleName);
    let FS = require('fs');
    let directoryPath = (path) => {
        return ts['getDirectoryPath'](path)
    }
    let relativePath = (path, base) => {
        return ts['convertToRelativePath'](path, base, f => f)
    }

    let resolvePath = (base, path) => {
        return ts['normalizePath'](ts['combinePaths'](base, path))
    }
    function parseJsonSourceFileConfigFileContent(sourceFile: JsonSourceFile, host: any, basePath: string, existingOptions?: any, configFileName?: string, resolutionStack?: Path[], extraFileExtensions?: JsFileExtensionInfo[]): ParsedCommandLine {
        let raw = JSON.parse(sourceFile.text);
        if(raw.resources){
           raw.extensions = Object.keys(raw.resources).map(k=>'.'+k);
        }
        if (Array.isArray(raw.extensions)) {
            if (existingOptions) {
                existingOptions.extensions = raw.extensions;
            }
            extraFileExtensions = Array.isArray(extraFileExtensions)
                ? extraFileExtensions.concat(raw.extensions)
                : raw.extensions;
        }
        let result = superParseJsonSourceFileConfigFileContent(sourceFile, host, basePath, existingOptions, configFileName, resolutionStack, extraFileExtensions)
        if (result.raw.name) {
            result.options.name = result.raw.name;
        }
        if (result.raw.extensions) {
            result.options.extensions = result.raw.extensions;
        }
        if (result.raw.resources) {
            result.options.resources = result.raw.resources;
        }
        if (result.options.outDir && result.options.name) {
            result.options.outDir = result.options.outDir + '/' + result.options.name;
        }
        if (result.raw.version) {
            ts.sys.writeFile(`${result.options.outDir}/tsconfig.json`, JSON.stringify({
                "compilerOptions": {
                    "rootDir": "../..",
                    "baseUrl": "../.."
                }
            }))
            ts.sys.writeFile(`${result.options.outDir}/package.json`, JSON.stringify(result.raw, null, 2))
        }
        return result;
    }
    function hasExtension(fileName: string, exts: string[]) {
        for(var i=0;i<exts.length;i++){
            if(ts['fileExtensionIs'](fileName, exts[i])){
                 return exts[i]
            }
        }
        return null;
    }
    function isOneOfExtension(fileName: string, exts: string[]) {
        return !!hasExtension(fileName,exts);
    }
    function getSupportedExtensions(options, extraFileExtensions): string[] {
        let exts = superGetSupportedExtensions(options, extraFileExtensions);
        if (options.extensions) {
            exts = exts.concat(options.extensions)
        }
        return exts
    }
    
    function createSourceFile(fileName, sourceText, languageVersion, setParentNodes, scriptKind, options): SourceFile {
        let ext = options && options.extensions && hasExtension(fileName, options.extensions);
        if (ext) {
            ext = ext.substring(1).toLowerCase();
            let type = options.resources?options.resources[ext]:'application/octet-stream';
            let data = FS.readFileSync(fileName).toString('base64');
            sourceText = `export default module.resource('${ext}','${type}',\`${data}\`);`;
        }
        scriptKind = ts['ensureScriptKind'](fileName,scriptKind);
      
        let sourceFile = superCreateSourceFile(fileName, sourceText, languageVersion, setParentNodes, scriptKind, options);
        return sourceFile;
    }
    function createFunctionExpression(modifiers, asteriskToken, name, typeParameters, parameters, type, body) {
        if (parameters.length == 2 && parameters[0].name === exporterId) {
            parameters.push(ts.createParameter(undefined, undefined, undefined, requireId))
            parameters.push(ts.createParameter(undefined, undefined, undefined, exportsId))
            parameters.push(ts.createParameter(undefined, undefined, undefined, filenameId))
            parameters.push(ts.createParameter(undefined, undefined, undefined, dirnameId))
        }
        return superCreateFunctionExpression(modifiers, asteriskToken, name, typeParameters, parameters, type, body)
    }
    function resolveModuleName(moduleName, containingFile, compilerOptions, host, cache) {
        let result = superResolveModuleName(moduleName, containingFile, compilerOptions, host, cache)
        if (!result.resolvedModule && Array.isArray(compilerOptions.extensions)) {
            if (moduleName[0] == '.') {
                moduleName = resolvePath(directoryPath(containingFile), moduleName)
            }
            if (ts['fileExtensionIsOneOf'](moduleName, compilerOptions.extensions)) {
                result.resolvedModule = {
                    resolvedFileName: moduleName,
                    extension: '.html',
                    isExternalLibraryImport: false
                }
            }
            // let ext = ts['tryGetExtensionFromPath'](filePath);
            // if (ext) {
            //     filePath = ts['tryRemoveExtension'](filePath, ext);
            // }
            // let rootDir = compilerOptions.rootDir || directoryPath(compilerOptions.configFilePath);
            // let modPath = relativePath(filePath, rootDir);
            // let modName = resolvePath(compilerOptions.name, modPath);
        }
        //console.info(result);
        return result
    }

    function createUniqueName(name) {
        switch (name) {
            case "@ecmal/runtime": return superCreateUniqueName('runtime');
            case "exports": return exporterId;
            case "context": return contextId;
        }
        return superCreateUniqueName(name)
    }
    function getResolvedExternalModuleName(host: any, file: SourceFile): string {

        let moduleName;
        let compilerOptions = host.getCompilerOptions();

        if (compilerOptions.name) {
            file.moduleName = moduleName = getExternalModuleNameFromPath(host, file.fileName);
        } else {
            moduleName = superGetResolvedExternalModuleName(host, file)
        }
        return moduleName;
    }
    function getExternalModuleNameFromPath(host: any, fileName: string): string {

        let moduleName = superGetExternalModuleNameFromPath(host, fileName);

        let compilerOptions = host.getCompilerOptions();
        if (compilerOptions.name) {
            moduleName = `${compilerOptions.name}/${moduleName}`;
        }
        //console.info("getExternalModuleNameFromPath",fileName,moduleName);
        return moduleName;
    }
    function tryGetModuleNameFromFile(file: SourceFile, host: any): StringLiteral {
        if (!file) {
            return undefined;
        }
        if (file.moduleName) {
            return ts.createLiteral(file.moduleName);
        }
        if (!file.isDeclarationFile) {
            return ts.createLiteral(getExternalModuleNameFromPath(host, file.fileName));
        }
        return undefined;
    }
    export function onUnsupportedSourceFile(filename, compilerOptions) {
        //console.info("HEHE",compilerOptions.name,filename)
    }
    export function executeIoServer() {
        ts['ioSession'].listen();
    }
    if (ts['executeCommandLine']) {
        let executeCommandLine = ts['executeCommandLine'];
        ts['executeCommandLine'] = (args) => {
            //console.info("MY PATCH", args);
            executeCommandLine(args);
        }
    }
}