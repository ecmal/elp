import { Cli } from "./command";
export declare class Install extends Cli {
    save: boolean;
    saveDev: boolean;
    execute(...packages: any[]): void;
}
