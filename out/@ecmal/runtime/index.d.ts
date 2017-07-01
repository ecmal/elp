interface Module {
    parent: Module;
    require(id: string): any;
    import(id: any): Promise<any>;
}
interface System {
    module: Module;
}
declare const System: System;
