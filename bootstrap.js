// midway-logger 默认 enable file log，但要求 fileLogName；
// 项目里没声明 midway-logger，所以 coreLogger 启动会抛
// "Please set fileLogName when enable file log" 然后 exit 0。
// 解决方案：在 framework 启动前给 loggers 容器注入全局 disableFile，
// 让 logger 走 stdout-only（由 docker logs / deploy.sh logs 收集）。
const { loggers } = require('@midwayjs/logger');
loggers.updateContainerOption({ disableFile: true });

const WebFramework = require('@midwayjs/koa').Framework;
const web = new WebFramework().configure({
  port: 9007,
});

const { Bootstrap } = require('@midwayjs/bootstrap');
Bootstrap.load(web).run();
