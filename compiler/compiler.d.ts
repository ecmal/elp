import TS from "compiler/index";
export declare class Compiler implements TS.CompilerHost {
    fileExists(fileName: string): boolean;
    readFile(fileName: string): string;
    getSourceFile(fileName: string, target: TS.ScriptTarget, onError?: (message: string) => void): TS.SourceFile;
    getDefaultLibFileName(options: TS.CompilerOptions): string;
    writeFile(fileName: string, data: string, writeByteOrderMark: boolean, onError?: (message: string) => void): void;
    getCurrentDirectory(): string;
    getCanonicalFileName(fileName: string): string;
    useCaseSensitiveFileNames(): boolean;
    getNewLine(): string;
    resolveModuleName(dirName: any, modName: any): any;
    resolveModuleNames(moduleNames: string[], containingFile: string): {
        resolvedFileName: any;
        isExternalLibraryImport: boolean;
    }[];
    private project;
    private program;
    private sources;
    constructor(project: any);
    options: TS.CompilerOptions;
    compile(): TS.Diagnostic[];
}
