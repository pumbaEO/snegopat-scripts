$engine JScript
$uname extSyntaxCheck
$dname Расширенние сообщений об ошибках .
$addin stdlib
$addin stdcommands

// (c) Сосна Евгений <shenja@sosna.zp.ua>

stdlib.require('TextWindow.js', SelfScript);
stdlib.require('ScriptForm.js', SelfScript);
stdlib.require('log4js.js', SelfScript);

var spell = stdlib.require(stdlib.getSnegopatMainFolder() + 'scripts\\SpellChecker.js');

var logger = Log4js.getLogger(SelfScript.uniqueName);
var appender = new Log4js.BrowserConsoleAppender();
appender.setLayout(new Log4js.PatternLayout(Log4js.PatternLayout.TTCC_CONVERSION_PATTERN));
logger.addAppender(appender);
logger.setLevel(Log4js.Level.ERROR);

SelfScript.self['macrosНастройка'] = function() {
    extSyntaxCheck = GetExtSyntaxCheck();
    extSyntaxCheck.show();
}

SelfScript.self['macrosПроверка синтаксиса и орфографии для изменненых строк'] = function(){
    syntaxAndSpellCheck();
}

function syntaxAndSpellCheck() {
    if(stdcommands.Frntend.SyntaxCheck.getState().enabled)
        stdcommands.Frntend.SyntaxCheck.send();
    
    var wnd = GetTextWindow();
    
    var text = "";
    if (wnd){
        text = wnd.GetText();
        text = text.split('\n');
        spellChecker = spell.GetSpellChecker();
    } else {
        return;
    }

    var sciMgr = addins.byUniqueName("SciColorerV8Manager").object;
    var hwnd = sciMgr.getActiveScintillaHandle();
    if (hwnd){
        var nextModLine = sciMgr.SendSciMessage(hwnd,sciMgr.SCI_GETNEXTMODLINE,0,-1);
        var curModLine = -1;
        while (nextModLine > curModLine){
             while (sciMgr.SendSciMessage(hwnd,sciMgr.SCI_GETMODLINESTATE,nextModLine) > 0){
                spellChecker.SpellLine(text[nextModLine-1], wnd, nextModLine-1);
                nextModLine++;
            }
            curModLine = nextModLine;
            nextModLine = sciMgr.SendSciMessage(hwnd,sciMgr.SCI_GETNEXTMODLINE,0,curModLine);
        }   
   }
}

ExtSyntaxCheck = ScriptForm.extend({

    settingsRootPath : SelfScript.uniqueName,
    
    settings : {
        pflSnegopat : {
            'cathSyntaxCheck': false,
            'maxLength' : 45,
            'checkLengthFunction': false // Перехватывать комманду синтаксической проверки.
        }
    },

    construct : function () {
        
        this._super(SelfScript.fullPath.replace(/.js$/, '.ssf')); //Загрузим форму с настройками, форма должна называться так же как и скрипт, только с расширением ssf
        this.RE = new RegExp("^(\\{.{1,}\\}\:.{1,}\)$", "mig"); 
        this.re_column = new RegExp("\\(\(\\d{1,})\,(\\d{1,})\\)\\}\:", "i");
        this.RE_ERROR_TEXT = new RegExp("\\s\\((Проверка\\:\\s.{1,})\\)$", "gim");
        this.errors = {};
        this.loadSettings(); //Загрузим сохраненные настройки. 
        
        ExtSyntaxCheck._instance = this;
    }, 
    
    loadSettings: function(){
        this._super();
        
        if (this.form.cathSyntaxCheck) { 
            //Подключаемся к команде проверки текста 
            logger.debug('loadSettings addHandler')
             stdcommands.Frntend.SyntaxCheck.addHandler(this, "onSyntaxCheck");
            
        } else {
            logger.debug('loadSettings delHandler')
            try {
                stdcommands.Frntend.SyntaxCheck.delHandler(this, "onSyntaxCheck");
            } catch(e) {
                logger.debug(e.description);
            }
            
        }
        
    },

    analizeModule: function(){
        logger.debug("analizeModule");
        var parser = snegopat.parseSources(this.wnd.GetText());

        for(var i = 0, c = parser.lexemCount; i < c; i++)
        {
            var lex = parser.lexem(i)
            if(lex.type==40 )
            i+= this.analizeFunction(parser,i,lex);
           } 
    },
    
    analizeFunction: function(parser,start,startlex){

        line = 0;
        name = parser.lexem(start+1).text;
        lastline = startlex.line;
        var i,c, wnd = GetTextWindow();
        for(i = start, c = parser.lexemCount; i< c; i++){
            var lex = parser.lexem(i);
            var maxLines = this.form.maxLength;
            if(lex.type==42){
                if(line > maxLines) {
                var param = {};
                param['wnd'] = wnd;
                param['line'] = startlex.line;
                message("Функция "+name+" большая. Лишних "+(line - maxLines)+" строк ",mExc1, this.onClick_Message, param);
                }
            break;
            }
            if (lex.type == 1) // коменты не считаются кодом.
                continue;
            line+= (lastline==lex.line) ? 0:1; // смениться после прочтения перевода строки. а это может только при честном переводе или если прочли многострочную строку
            lastline =lex.line;
        }
        return (i - start);
    }, 

    onClick_Message: function(param){

        if (!param['wnd']) {
            return 
        }
        if (!param['wnd'].IsActive()) {
            return 
        }
        param['wnd'].SetCaretPos(param['line']+1, 1);
        view = param['wnd'].GetView();
        if (!view){
            
        } else {
            logger.debug('view activate ');
            view.activate();
        }
        
        param = null

    },

    onSyntaxCheck: function (cmd){
        logger.debug('onSyntaxCheck ')
        if (cmd.isBefore){
            this.wnd = new TextWindow();
        }
        if(!cmd.isBefore)
        { 
            logger.debug('onSyntaxCheck disconnect')
            try {
                    events.disconnect(Designer, "onMessage", this);

                 } catch (e) { }
                 
            hasErrors = false;
            
            for (var k in this.errors){
                hasErrors = true;
                text = this.errors[k];
                var Matches = this.re_column.exec(text);
                if (Matches != null){
                    
                    
                    var param = {}
                    param['wnd'] = this.wnd;
                    param['line'] = Matches[1];
                    param['column'] = Matches[2];
                    logger.debug('onSyntaxCheck вывод сообщения по регулярному выражению.');
                    Message(text, mExc3, (function(param){
                        logger.debug('on Message Обработчик событий.');
                        if (!param['wnd']) {
                            return 
                        }
                        if (!param['wnd'].IsActive()) {
                            return 
                        }
                        param['wnd'].SetCaretPos(param['line'], param['column']);
                        view = param['wnd'].GetView();
                        if (!view){
                            
                        } else {
                            logger.debug('view activate ');
                            view.activate();
                        }
                        
                        param = null
                        
                        
    }), param);
                } else {
                    logger.debug('onSyntaxCheck вывод сообщения - не смогли определить.');
                    Message(''+text);
                }
            }
            this.errors = {};
            if (this.form.checkLengthFunction){
                this.analizeModule();
            }
        } else {
            logger.debug('onSyntaxCheck connect')
            events.connect(Designer, "onMessage", this);
        }
        logger.debug('onSyntaxCheck end')
    },
    
    onMessage:function(param){
        text = param.text;
        if (!text.length)
            return
        
        this.RE = new RegExp("^(\\{.{1,}\\}\:.{1,}\)$", "mig"); 
        if ((Matches = this.RE.exec(text)) != null){
            param.cancel = true;
            str = Matches[1];
            if (!this.errors[str]){
                this.errors[str] = text;
            } else {
                this.RE_ERROR_TEXT = new RegExp("\\s\\((Проверка\\:\\s.{1,})\\)$", "gim");
                param.cancel = true;
                if ((Matches_error = this.RE_ERROR_TEXT.exec(text)) != null){
                    str_error = Matches_error[0];
                    this.errors[str] = this.errors[str]+' '+str_error;
                }
            }
        }
    },
    
    Ok_Click:function(Button){
        this.saveSettings();
        this.loadSettings();
        this.form.Close();
    }, 

    Close_Click:function(Button){
        this.form.Close();
    }

})


function GetExtSyntaxCheck() {
    if (!ExtSyntaxCheck._instance)
        new ExtSyntaxCheck();
    
    return ExtSyntaxCheck._instance;
}

GetExtSyntaxCheck();