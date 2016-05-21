import { Cli } from "./command";
export declare class Compile extends Cli {
    watch: boolean;
    output: boolean;
    tests: boolean;
    execute(path?: string): void;
}
