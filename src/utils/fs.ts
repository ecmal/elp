

export class FileSystem {
    private static fs = require('fs');
    private static path = require('path');
    private static crypto = require('crypto');
    static resolve(...paths:string[]):string{
        return this.path.resolve(...paths);
    }
    static relative(base:string,path:string):string{
        return this.path.relative(base,path);
    }
    static basename(path:string,ext?:string):string{
        return this.path.basename(path,ext);
    }
    static dirname(path:string):string{
        return this.path.dirname(path);
    }
    static extname(path:string){
        return this.path.extname(path);
    }
    static exists(path){
        return this.fs.existsSync(path)
    }
    static stats(path){
        return this.fs.statSync(path);
    }
    static isDir(path){
        return this.exists(path) && this.stats(path).isDirectory();
    }
    static isFile(path){
        return this.exists(path) && this.stats(path).isFile();
    }
    static cleanDir(path,filter?:(f:string)=>boolean){
        if( this.fs.existsSync(path) ) {
            var files = this.fs.readdirSync(path);
            if(filter){
                files = files.filter(filter);
            }
            files.forEach((file,index)=>{
                var curPath = path + "/" + file;
                if(this.fs.lstatSync(curPath).isDirectory()) { // recurse
                    this.cleanDir(curPath,filter);
                } else { // delete file
                    this.fs.unlinkSync(curPath);
                }
            });
            if(this.fs.readdirSync(path).length==0){
                this.fs.rmdirSync(path);
            }
        }
    }
    static removeDir(path){
        if( this.fs.existsSync(path) ) {
            this.fs.readdirSync(path).forEach((file,index)=>{
                var curPath = path + "/" + file;
                if(this.fs.lstatSync(curPath).isDirectory()) { // recurse
                    this.removeDir(curPath);
                } else { // delete file
                    this.removeFile(curPath);
                }
            });
            this.fs.rmdirSync(path);
        }
    }
    static copyDir(fromDir,toDir){
        this.readDir(fromDir,true).forEach(f=>{
            var t = this.resolve(toDir,this.relative(fromDir,f));
            this.copyFile(f,t);
        })
    }
    static readDir(dir,recursive=false,includeDirs=false) {
        var items = this.fs.readdirSync(dir).map((s)=>{
            return this.path.resolve(dir,s);
        });
        var files=[],dirs=[];
        items.forEach((f)=>{
            if(this.fs.statSync(f).isDirectory()){
                dirs.push(f);
            }else{
                files.push(f);
            }
        });
        if(recursive) {
            dirs.forEach((d)=> {
                files = files.concat(this.readDir(d,recursive));
            });
        }
        if(includeDirs){
            files = dirs.concat(files)
        }
        return files;
    }
    static watchDir(path,cb:(e:string,f:string)=>void,recursive=true):any{
        return this.fs.watch(path,{ persistent: true, recursive },cb);
    }
    static createDir(path,recursive=false){
        if(recursive){
            var parts = this.path.normalize(path).split(this.path.sep);
            path = '';
            for (var i = 0; i < parts.length; i++) {
                path += parts[i] + this.path.sep;
                if (!this.fs.existsSync(path)) {
                    this.fs.mkdirSync(path, 0x1FD);
                }
            }
        }else {
            this.fs.mkdirSync(path);
        }
    }
    static removeFile(path){
        this.fs.unlinkSync(path)
    }
    static copyFile(fromPath,toPath) {
        this.writeFile(toPath,this.readFile(fromPath));
    }
    static chmodFile(path:string,mode:string){
        this.fs.chmodSync(path, parseInt(mode,8));
    }
    static writeFile(path:string,data:any){
        var dirname = this.dirname(path);
        if(!this.exists(dirname)){
            this.createDir(dirname,true);
        }
        if(typeof data == 'string'){
            return this.fs.writeFileSync(path,data,'utf8');
        }else{
            return this.fs.writeFileSync(path,data,'binary');
        }
    }
    static writeJson(path:string,data:any){
        return this.writeFile(path,JSON.stringify(data,null,'  ')+'\n');
    }
    static readFile(path:string):any {
        return this.fs.readFileSync(path);
    }
    static readFileHash(path:string):string{
        return this.crypto.createHash('md5').update(this.readFile(path)).digest("hex");
    }
    static readJson(path:string):any {
        return JSON.parse(this.fs.readFileSync(path));
    }
}
export default FileSystem;