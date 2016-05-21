export declare class Config {
    name: string;
    home: string;
    config: string;
    dirname: string;
    filename: string;
    env: any;
    settings: any;
    constructor();
    private checkHome();
    private checkConfig();
    private checkRegistries();
    private checkPlugins();
    load(): Promise<Config>;
}
declare var _default: Config;
export default _default;
