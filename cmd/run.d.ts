import { Cli } from "./command";
export declare class Run extends Cli {
    static SM: any;
    watch: boolean;
    test: boolean;
    private project;
    private maps;
    private mapFor(path, line, column);
    private regexp;
    format(l: any): any;
    execute(...args: any[]): void;
}
