import './cmd/init';
import './cmd/install';
import './cmd/compile';
import './cmd/publish';
import './cmd/validate';
import './cmd/status';
import './cmd/show';
import './cmd/fetch';
import './cmd/cache';
import './cmd/clone';
import './cmd/remotes';
import './cmd/bundle';
import './cmd/run';

import cli from './cmd/command';
import config from './config';
import services from './services';

config.load().then(config=>{
    const path = system.node.require('path');
    const info = system.node.require(path.resolve(path.dirname(module.url),'package.json'));
    return services.load(config).then(()=>{
        return cli(info.name,info.version);
    })
}).catch(e=>console.error(e.stack));


