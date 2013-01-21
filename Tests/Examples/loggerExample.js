$engine JScript
$uname testLog
$dname Тест log
$addin stdlib
$addin hotkeys

stdlib.require("log4js.js", SelfScript);

function macrosTest1() {
	
	var log4jsLogger = Log4js.getLogger("Log4js");
	
	log4jsLogger.addAppender(new Log4js.BrowserConsoleAppender());
	log4jsLogger.setLevel(Log4js.Level.ALL);
	
	
	log4jsLogger.trace("test");
	log4jsLogger.debug("test");
	log4jsLogger.info('test');
	log4jsLogger.warn('test');
	log4jsLogger.error('test');
	log4jsLogger.fatal('test');
}

function macrosTest2() {

	var log4jsLogger = Log4js.getLogger("Log4js");
	
	var appender = new Log4js.BrowserConsoleAppender();
	appender.setLayout(new Log4js.PatternLayout(Log4js.PatternLayout.TTCC_CONVERSION_PATTERN));
	log4jsLogger.addAppender(appender);
	log4jsLogger.setLevel(Log4js.Level.DEBUG);

	log4jsLogger.trace("test");
	log4jsLogger.debug("test");
	log4jsLogger.info('test');
	log4jsLogger.warn('test');
	log4jsLogger.error('test');
	log4jsLogger.fatal('test');
}

function macrosTestLogToFile() {

	var log4jsLogger = Log4js.getLogger("Log4js");
	
	var appender = new Log4js.FileAppender(stdlib.getSnegopatMainFolder()+'log4js.log');
	appender.setLayout(new Log4js.PatternLayout(Log4js.PatternLayout.TTCC_CONVERSION_PATTERN));
	log4jsLogger.addAppender(appender);
	log4jsLogger.setLevel(Log4js.Level.TRACE);

	log4jsLogger.trace("test");
	log4jsLogger.debug("test");
	log4jsLogger.info('test');
	log4jsLogger.warn('test');
	log4jsLogger.error('test');
	log4jsLogger.fatal('test');
}