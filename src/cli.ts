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

import cli from './cmd/command';
import config from './config';
import services from './services';

config.load().then(config=>{
    return services.load(config).then(()=>{
        return cli('espm','1.0.0');
    })
}).catch(e=>console.error(e.stack));


