import { Cli } from "./command";
export declare class Bundle extends Cli {
    file: string;
    executable: boolean;
    execute(path?: string): void;
}
