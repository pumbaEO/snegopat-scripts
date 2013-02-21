$engine JScript
$uname formatModule
$dname Форматирование модуля
$addin stdlib
$addin hotkeys
$addin global
$addin stdcommands

// (c) Сосна Евгений <shenja@sosna.zp.ua>
// По заказу Дмитрий Круглов <d.d.kruglov@gmail.com>  
// использует обработку http://infostart.ru/public/166814/
// 


stdlib.require('ScriptForm.js', SelfScript);
stdlib.require('TextWindow.js', SelfScript);
stdlib.require('log4js.js', SelfScript);

stdlib.require(stdlib.getSnegopatMainFolder() + 'scripts\\epf\\epfloader.js', SelfScript);
global.connectGlobals(SelfScript);

var logger = Log4js.getLogger(SelfScript.uniqueName);
var appender = new Log4js.BrowserConsoleAppender();
appender.setLayout(new Log4js.PatternLayout(Log4js.PatternLayout.TTCC_CONVERSION_PATTERN));
logger.addAppender(appender);
logger.setLevel(Log4js.Level.ERROR);


////////////////////////////////////////////////////////////////////////////////////////
////{ Макросы
////

SelfScript.self['macrosНастройка'] = function() {
    var sm = GetFormatModule();
    sm.changeSettings();
    return true;
}

SelfScript.self['macrosОтформатировать выделенный текст'] = function() {
    var sm = GetFormatModule();
    sm.formatSelectedText();
    return true;
}

SelfScript.self['macrosОтформатировать выделенный текст с выбором настройки'] = function() {
    var sm = GetFormatModule();
    row = sm.table.ChooseRow();
    if (!row)
        return true;
    sm.formatSelectedTextSettings(row.name);
    return true;
}

SelfScript.self['macrosПоказ результата форматирования'] = function() {
    var sm = GetFormatModule();
    sm.formatSelectedText(true);
    return true;
}





/* Возвращает название макроса по умолчанию - вызывается, когда пользователь 
дважды щелкает мышью по названию скрипта в окне Снегопата. */
function getDefaultMacros() {
    return 'Настройка';
}

////} Макросы

FormatModule = ScriptForm.extend({

    settingsRootPath : SelfScript.uniqueName,
    
    settings : {
        pflSnegopat : {
            'pathToSettings': "", // Путь к каталогу с файлами настроек. 
            'autoReplace'   : true, //Автозаменна текста после форматирования. 
            'defaultSettings' : "" 
        }
    },

    construct : function () {
        
        this._super("scripts\\formatModule.ssf");
        logger.debug('construct')

        this.table = v8New("ValueTable");
        this.table.Columns.Add("name");
        this.table.Columns.Add("path");
        this.RowFont = v8New('Font', undefined, undefined, true);
        this.loadSettings();

        this.watcher = new TextWindowsWatcher();
        this.watcher.startWatch();

        FormatModule._instance = this;

    }, 

    saveSettings_Click : function(Button){
        this.saveSettings();
        this.loadSettings();
    },
    
    formatText_Click : function(Button){
        var text = this.form.Controls.ИсходныйТекст.GetText();
        var newText = this.processSelectedText(text, this.form.defaultSettings);
        this.form.Controls.ФорматированныйТекст.SetText('');
        this.form.Controls.ФорматированныйТекст.SetText(newText);
    },
    
    compareText_Click : function(Button){
            logger.debug('Сравнение текстов');
            var Файл1 = ПолучитьИмяВременногоФайла();
            var Файл2 = ПолучитьИмяВременногоФайла();
            this.form.Controls.ИсходныйТекст.Записать(Файл1);
            this.form.Controls.ФорматированныйТекст.Записать(Файл2);
            logger.debug('file 1:'+Файл1 + " file 2:"+Файл2);
            ОбъектСравнения                                = v8New("СравнениеФайлов");
            ОбъектСравнения.ПервыйФайл                     = Файл1;
            ОбъектСравнения.ВторойФайл                     = Файл2;
            ОбъектСравнения.ИгнорироватьПустоеПространство = true;
            ОбъектСравнения.СпособСравнения                = СпособСравненияФайлов.ТекстовыйДокумент;
            ОбъектСравнения.ПоказатьРазличия();
            УдалитьФайлы(Файл1);
            УдалитьФайлы(Файл2);
    }, 

    repleaceText_Click : function(Button){
        var tw = this.watcher.getActiveTextWindow()
        if (!tw) return

        var newText = this.form.Controls.ФорматированныйТекст.GetText();
        var es = this;
        var res = {param:newText, func:function(newText){
            var tw = es.textWindow;
            if (!tw) {
                return;
            }
            tw.SetSelectedText(newText);
            }};
        
        this.form.Close(res);
    },

    BtSetDefault_Click:function (Button) {
        if (!this.form.Controls.FileTable.CurrentData)  
            return
        this.form.defaultSettings = this.form.Controls.FileTable.CurrentData.name;
        this.form.Controls.DefaultSettingsLabel.Caption = ""+this.form.defaultSettings;
    },

    processSelectedText : function(text, currSettings){

        logger.info('processSelectedText ');
        if (!currSettings)
            logger.debug('Настройка форматирования не задана!');
        if (!this.epfLoader){
            try{
            
                this.epfLoader = EpfLoader.getEpf("ФорматированиеТекста");
            } catch (e){
                this.epfLoader = null
                logger.error("Не удалось загрузить epfloader обработку ФорматированиеТекста");
                return text;
            }
            
        }
               
        if (!currSettings) currSettings = this.form.defaultSettings;
        logger.debug('Настройка форматирования: '+currSettings)
        var pathToSettings = "";
        var settingsXml = "";
        if (this.table.Count() >0 &&  currSettings.length> 0) {
            var filterStructure = v8New("Structure");
            filterStructure.Insert("name", currSettings);
            var filteredRows = this.table.FindRows(filterStructure);
            logger.debug("Найденно строк "+filteredRows.Count());
            if (filteredRows.Count()>0) {
                var path = filteredRows.Get(0).path;
                logger.debug('Путь '+path);
                try{
                    var textDocument = v8New("TextDocument");
                    textDocument.Read(getAbsolutePath(path))
                    settingsXml = textDocument.GetText();    
                    pathToSettings = getAbsolutePath(path);
                } catch(e){
                    logger.error("Не смогли прочитать файл настроек, ошибка "+e.description+"\n\t"+getAbsolutePath(this.form.pathToSettings));
                    //Message("Не смогли прочитать файл настроек, ошибка "+e.description+"\n\t"+getAbsolutePath(this.form.pathToSettings));
                }

            }
        }
        logger.debug('Путь к настройкам:'+pathToSettings)
        var newText = this.epfLoader.ФорматированиеТекстаПоНастройке(text, pathToSettings);
        
        logger.info("Старый текст:==============");
        logger.info(text);
        logger.info("Новый текст:==============");
        logger.info(text);

        return newText;
    }, 

    formatSelectedText : function(viewForm){
        var tw = this.watcher.getActiveTextWindow()
        if (!tw) return
        this.textWindow = tw;
        if (!viewForm) viewForm = false
        text = tw.GetSelectedText();
        newText = this.processSelectedText(text);
        
        if (!viewForm){
            tw.SetSelectedText(newText);
        } else {
            this.form.Controls.ИсходныйТекст.УстановитьТекст(text);
            this.form.Controls.ФорматированныйТекст.УстановитьТекст(newText);
            var res = this.show(true);
            if (res){
                var typeName = Object.prototype.toString.call(res);
                if (typeName === '[object Object]') { 
                    res.func(res.param);
                }
            }
        }

    }, 

    formatSelectedTextSettings:function (currSettings) {
        var tw = this.watcher.getActiveTextWindow()
        if (!tw) return

        text = tw.GetSelectedText();
        newText = this.processSelectedText(text, currSettings);
        tw.SetSelectedText(newText);
        // body...
    },

    beforeExitApp : function () {
        this.watcher.stopWatch();
    }, 
    
    changeSettings : function(){
        this.show(true);
    }, 

    loadAllSettings: function() {
        logger.debug('loadAllSettings' );

        var fso = new ActiveXObject("Scripting.FileSystemObject");
        var path = getAbsolutePath(this.form.pathToSettings);
        if (!pathExists(path)){
            logger.warn('Путь:'+path+' не существует ');
            return;
        }
        this.table.Clear();
        var re_epf = /\.xml$/i;
        (function (loader, root) {
            if (root.length==0) 
                return
            var f = v8New("File", root);
            if (!f.Exist()) {
                return;
            }
            var folder = fso.GetFolder(root);
            var folders = new Enumerator(folder.SubFolders);
            for (; !folders.atEnd(); folders.moveNext()) {
                logger.trace('Рекурсия для каталога '+folders.item().Path);
                arguments.callee(loader, folders.item().Path);
            }
            var files = new Enumerator(folder.Files);
            for (; !files.atEnd(); files.moveNext()) {
                var file = files.item();
                if (re_epf.test(file.Name)) {
                    logger.debug('Загружаем настройку '+file.Path);
                    loader.loadXml(file.Path);
                }
            }
        })(this, path);

    },

    loadXml:function(path){
        
        var f = v8New("File", path);
        if (f.Exist()){
            var newRow = this.table.Add();
            newRow.Name = f.BaseName;
            newRow.path = f.FullName;    
        }

    }, 
    
    loadSettings:function(){
        logger.debug('loadSettings');
        this._super();
        this.loadAllSettings();
    }, 
    
    Form_OnOpen : function () {
        this.form.Controls.DefaultSettingsLabel.Caption = ""+this.form.defaultSettings;

        this.form.FileTable.Clear();
        for(var rows = new Enumerator(this.table); !rows.atEnd(); rows.moveNext()){
            var newRow = this.form.FileTable.Add();
            newRow.name = rows.item().name;
            newRow.path = rows.item().path;
        }
        
    },

    FileTable_OnRowOutput : function (Control, RowAppearance, RowData) {
        
        if (RowData.val.name == this.form.defaultSettings){
            RowAppearance.val.Font = this.RowFont;
        }
        
    }
    

})





////////////////////////////////////////////////////////////////////////////////////////
////{ TextWindowsWatcher - отслеживает активизацию текстовых окон и запоминает последнее.
////

TextWindowsWatcher = stdlib.Class.extend({

    construct : function() {
        this.timerId = 0;
        this.lastActiveTextWindow = null;
        this.startWatch();
    },

    getActiveTextWindow : function () {
        if (this.lastActiveTextWindow && this.lastActiveTextWindow.IsActive())
            return this.lastActiveTextWindow;
        return null;
    },

    startWatch : function () {
        if (this.timerId)
            this.stopWatch();
        this.timerId = createTimer(500, this, 'onTimer');
    },

    stopWatch : function () {
        if (!this.timerId)
            return;
        killTimer(this.timerId);
        this.timerId = 0;
    },

    onTimer : function (timerId) {
        logger.trace('onTimer');
        var wnd = GetTextWindow();    
        if (wnd)
            this.lastActiveTextWindow = wnd;
        else if (this.lastActiveTextWindow && !this.lastActiveTextWindow.IsActive())
            this.lastActiveTextWindow = null;
    }
    
}); // end of TextWindowsWatcher class

//} TextWindowsWatcher 

function fileExists(path) {

    if (path) 
    {
        var f = v8New('File', path);
        return f.IsFile() && f.Exist();
    }
    
    return false;
}

function pathExists(path) {

    if (path) 
    {
        var f = v8New('File', path);
        return f.Exist();
    }
    
    return false;
}



function getAbsolutePath(path) {

    // Путь относительный?
    logger.debug('start getAbsolutePath '+path)
    if (path.match(/^\.{1,2}[\/\\]/))
    {
        // Относительные пути должны задаваться относительно главного каталога Снегопата.
        var mainFolder = profileRoot.getValue("Snegopat/MainFolder");
        return mainFolder + path;
    }
    logger.debug('return getAbsolutePath '+path)
    return path;
}

function GetFormatModule() {
    if (!FormatModule._instance)
        new FormatModule();
    
    return FormatModule._instance;
}



//var cht = GetFormatModule();
events.connect(Designer, "beforeExitApp", GetFormatModule());