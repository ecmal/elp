/// <reference types="typescript/lib/typescriptServices" />

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
    let superGetLocalNameForExternalImport = ts.override(getExternalModuleNameFromPath);
    let superTryGetModuleNameFromFile = ts.override(tryGetModuleNameFromFile);
    let superCreateFunctionExpression = ts.override(createFunctionExpression);
    let superParseJsonSourceFileConfigFileContent = ts.override(parseJsonSourceFileConfigFileContent);
    function parseJsonSourceFileConfigFileContent(sourceFile: JsonSourceFile, host: ParseConfigHost, basePath: string, existingOptions?: CompilerOptions, configFileName?: string, resolutionStack?: Path[], extraFileExtensions?: JsFileExtensionInfo[]): ParsedCommandLine{
        let result = superParseJsonSourceFileConfigFileContent(sourceFile, host, basePath, existingOptions, configFileName, resolutionStack, extraFileExtensions)
        if(result.raw.name){
            result.options.name = result.raw.name;
        }
        if(result.options.outDir && result.options.name){
            result.options.outDir = result.options.outDir+'/'+result.options.name;
        }
        //console.info(result);
        return result;
    }
    function createFunctionExpression(modifiers, asteriskToken, name, typeParameters, parameters, type, body) {
        if(parameters.length == 2 && parameters[0].name===exporterId){
            parameters.push(ts.createParameter(undefined, undefined, undefined, requireId))
            parameters.push(ts.createParameter(undefined, undefined, undefined, exportsId))
            parameters.push(ts.createParameter(undefined, undefined, undefined, filenameId))
            parameters.push(ts.createParameter(undefined, undefined, undefined, dirnameId))
        }
        return superCreateFunctionExpression(modifiers, asteriskToken, name, typeParameters, parameters, type, body)
    }
    function getLocalNameForExternalImport(node, sourceFile) {
        console.info("getLocalNameForExternalImport")
        return superGetLocalNameForExternalImport(node, sourceFile);
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
        //console.info("getResolvedExternalModuleName")
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
        //console.info("getExternalModuleNameFromPath")
        let moduleName = superGetExternalModuleNameFromPath(host, fileName);
        let compilerOptions = host.getCompilerOptions();
        if (compilerOptions.name) {
            moduleName = `${compilerOptions.name}/${moduleName}`;
        }
        return moduleName;
    }
    function tryGetModuleNameFromFile(file: SourceFile, host: any): StringLiteral {
        //console.info("tryGetModuleNameFromFile")
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
    export function executeIoServer(){
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