type Constructor<T> = new (...args: any[]) => T;
type Dictionary<T=any> = {
    [s: string]: T;
}

interface Error {
    [s: string]: any;
    cause?(): Error;
    cause?(ex: Error): this;
}
// System API
interface Module {
    id: string;
    url: string;
    exports?: any;
    requires?: string[];
}
interface Modules {
    map<T>(condition: (m: Module) => T): T[];
    find(condition: (m: Module) => boolean): Module;
    filter(condition: (m: Module) => boolean): Module[];
    has(id: string): boolean;
    get(id: string): Module;
    add(module: Module): this;
}
interface ModuleSetter {
    (exports: any): void
}
interface ModuleExporter {
    (name: string, value: any): void;
    (exports: any): void;
}
interface ModuleExecutor {
    setters?: ModuleSetter[];
    execute?: () => void;
}
interface ModuleDefiner {
    (exporter: ModuleExporter, module: Module, require?:any, exports?:any, __filename?:any, __dirname?:any): ModuleExecutor | void
}
interface System {
    platform: "app" | "web";
    url: string;
    root: string;
    modules: Modules;
    require(id: string): any;
    import(id: string): Promise<any>;
    register(module: Module): this;
    register(id: string, dependencies: string[], definer: ModuleDefiner): this;
}
interface Console {
    assert(test?: boolean, message?: string, ...optionalParams: any[]): void;
    clear(): void;
    count(countTitle?: string): void;
    debug(message?: any, ...optionalParams: any[]): void;
    dir(value?: any, ...optionalParams: any[]): void;
    dirxml(value: any): void;
    error(message?: any, ...optionalParams: any[]): void;
    exception(message?: string, ...optionalParams: any[]): void;
    group(groupTitle?: string, ...optionalParams: any[]): void;
    groupCollapsed(groupTitle?: string, ...optionalParams: any[]): void;
    groupEnd(): void;
    info(message?: any, ...optionalParams: any[]): void;
    log(message?: any, ...optionalParams: any[]): void;
    msIsIndependentlyComposed(element: any): boolean;
    profile(reportName?: string): void;
    profileEnd(): void;
    select(element: any): void;
    table(...data: any[]): void;
    time(timerName?: string): void;
    timeEnd(timerName?: string): void;
    timeStamp(label?: string);
    trace(message?: any, ...optionalParams: any[]): void;
    warn(message?: any, ...optionalParams: any[]): void;
}

declare var Console: {
    prototype: Console;
    new(): Console;
};
declare var console: Console;

declare function setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): any;
declare function clearTimeout(timeoutId: any): void;
declare function setInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]): any;
declare function clearInterval(intervalId: any): void;
declare function setImmediate(callback: (...args: any[]) => void, ...args: any[]): any;
declare function clearImmediate(immediateId: any): void;

declare module "@ecmal/runtime" {
    export function __extends(d: Function, b: Function): void;
    export function __assign(t: any, ...sources: any[]): any;
    export function __rest(t: any, propertyNames: (string | symbol)[]): any;
    export function __decorate(decorators: Function[], target: any, key?: string | symbol, desc?: any): any;
    export function __param(paramIndex: number, decorator: Function): Function;
    export function __metadata(metadataKey: any, metadataValue: any): Function;
    export function __awaiter(thisArg: any, _arguments: any, P: Function, generator: Function): any;
    export function __generator(thisArg: any, body: Function): any;
    export function __exportStar(m: any, exports: any): void;
    export function __values(o: any): any;
    export function __read(o: any, n?: number): any[];
    export function __spread(...args: any[]): any[];
    export function __await(v: any): any;
    export function __asyncGenerator(thisArg: any, _arguments: any, generator: Function): any;
    export function __asyncDelegator(o: any): any;
    export function __asyncValues(o: any): any;
}