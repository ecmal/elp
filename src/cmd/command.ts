const OPTIONS:symbol = Symbol();
const COMMAND:symbol = Symbol();
const COMMANDS = [];

export function Option(settings?):any{
    return (target:any,key:string) => {
        if(!settings.name){
            settings.name = key;
        }
        var options = target.constructor[OPTIONS];
        if(!options){
            options = target.constructor[OPTIONS] = {};
        }
        options[key] = settings;
    }
}
export function Command(settings?):any{
    if(!settings){
        settings = {};
    }
    return target=>{
        if(!settings.name){
            settings.name = String(target.name)
                .replace(/([A-Z])/g,a=>'-'+a)
                .toLowerCase()
                .replace(/\-(.*)/,'$1');
        }
        settings.options = target[OPTIONS]||{};
        delete target[OPTIONS];

        var parent = target.prototype.__proto__.constructor[COMMAND];
        if(parent && parent.options){
            for(var i in parent.options){
                if(!settings.options[i]){
                    settings.options[i] = parent.options[i]
                }
            }
        }
        target[COMMAND] = settings;
        if(target.name!='Cli'){
            COMMANDS.push(target);
        }
    }
}

@Command()
export class Cli {
    static title:string;
    static version:string;

    static help(){
        var meta = this[COMMAND];
        var options = Object.keys(meta.options).map((option:any)=>{
            option = meta.options[option];
            return `  -\033[1m${option.alias}\033[0m, --\033[1m${option.name}\033[0m : ${option.title}`;
        });
        var commands = this!=Cli?[]:COMMANDS.map(c=>c[COMMAND]).map(command=>{
            return `   \033[1m${command.name}\033[0m : ${command.title}`;
        });
        var head = [],parent = this.prototype.__proto__.constructor[COMMAND];
        if(parent){
            head.push(parent.name);
        }
        head.push(meta.name);
        if(options.length){
            head.push('[options]')
        }
        if(commands.length){
            head.push('<command>')
        }else
        if(meta.args){
            head.push(meta.args)
        }
        var help = ['',head.join(' ')];
        if(options.length){
            help.push('');
            help.push('Options : ');
            help.push(...options);
        }
        if(commands.length){
            help.push('');
            help.push('Commands : ');
            help.push(...commands);
        }
        if(meta.usage){
            if(Array.isArray(meta.usage)){
                meta.usage = meta.usage.join('\n');
            }
            help.push('');
            help.push(meta.usage.split('\n')
                .filter(l=>!!l)
                .map(l=>l.replace(/(\s+\|?)(.*)/,'$2'))
                .join('\n')
            );
        }
        help.push('');
        return help.join('\n');
    }

    @Option({
        alias    : 'h',
        title    : 'Print help'
    })
    help:boolean=false;

    @Option({
        alias    : 'v',
        required : true,
        title    : 'Print version'
    })
    version:boolean=false;

    execute(){
        if(this.version){
            console.info(`${Cli.title} ${Cli.version}`);
        } else
        if(this.help){
            var Class:any = this.constructor;
            console.info(Class.help(Class));
        }
    }
}
export default (name,version)=>{
    process.title = name;
    Cli.title = name;
    Cli.version = version;
    Cli[COMMAND].name = name;

    var Command:any=Cli,args = process.argv.slice(2);
    for(var i=0;i<args.length&&Command==Cli;i++){
        var arg = args[i];
        if(arg[0]!='-') {
            for (var c = 0; c < COMMANDS.length; c++) {
                if (COMMANDS[c][COMMAND].name == arg) {
                    args[i] = null;
                    Command = COMMANDS[c];
                }
            }
        }
    }
    var meta = Command[COMMAND];
    var metaOptions = (options=>{
        var map = {};
        for(var o in options){
            var option = options[o];
            map[option.name] = option;
            map[option.alias] = option;
        }
        return map;
    })(meta.options);

    var cmd=new Command(),params=[];
    for(var i=0;i<args.length;i++) {
        var key,metaOption,val,arg = args[i];
        if(arg) {
            if (arg[0] == '-') {
                if (arg[1] == '-') {
                    key = arg.substring(2);
                } else {
                    key = arg[1];
                }
                metaOption = metaOptions[key];
                if (metaOption) {
                    if (metaOption.args) {
                        if (arg[1] == '-') {
                            val = args[++i];
                        } else {
                            if (arg.length > 2) {
                                val = arg.substring(2);
                            } else {
                                val = args[++i]
                            }
                        }
                    } else {
                        val = true;
                    }
                    cmd[metaOption.name] = val;
                } else {
                    console.info('invalid option ' + arg);
                }
            } else {
                params.push(arg);
            }
        }
    }
    if(cmd.version || cmd.help){
        Cli.prototype.execute.call(cmd);
    }else{
        cmd.execute(...params);
    }
};