$engine JScript
$uname extDiffManager
$dname Расширенный diff для попроцедурного сравнения. 
$addin global
$addin stdlib
$addin stdcommands

global.connectGlobals(SelfScript)

stdlib.require('ScriptForm.js', SelfScript);
stdlib.require('log4js.js', SelfScript);
stdlib.require('SyntaxAnalysis.js', SelfScript);


var logger = Log4js.getLogger(SelfScript.uniqueName);
var appender = new Log4js.BrowserConsoleAppender();
appender.setLayout(new Log4js.PatternLayout(Log4js.PatternLayout.TTCC_CONVERSION_PATTERN));
appenders = [];
appenders.push(appender);
logger.onlog = new Log4js.CustomEvent();
logger.onclear = new Log4js.CustomEvent();

logger.setAppenders(appenders);
logger.setLevel(Log4js.Level.ERROR);


////////////////////////////////////////////////////////////////////////////////////////
////{ Cкрипт extDiffManager (extDiffManager.js) для проекта "Снегопат"
////
//// Описание: Добавляем в процесс объединения стороние инструменты. 
//// позволяет сравнивать модули объектов, формы с помощью kdiff , объединять 
//// результат сравнения и подгружать обратно в базу изменные. 
////
////
//// Автор: Сосна Евгений <shenja@sosna.zp.ua>
////
//// Зробленно в Україні.
////}
////////////////////////////////////////////////////////////////////////////////////////

SelfScript.self['macrosНастройка'] = function() {
    var sm = GetCompareWatcher();
    sm.changeSettings();
    return true;
}

SelfScript.self['macrosОбъединитьТекущуюПроцедуру'] = function(){
    var sm = GetCompareWatcher();
    sm.compareProcedure();
    return true;   
}

SelfScript.self['macrosОбъединитТекущийОбъект'] = function(){
    var sm = GetCompareWatcher();
    sm.mergeObject();
    return true;   
}

SelfScript.self['macrosСравнитьТекущийОбъект'] = function(){
    var sm = GetCompareWatcher();
    sm.compareObject();
    return true;   
}


SelfScript.self['macrosЗагрузитьРезультатыСравнения'] = function(){
    var sm = GetCompareWatcher();
    sm.applyPath();
    return true;   
}


CompareWatcher = stdlib.Class.extend({

	construct:function(){

		this.modalForm=null;
		this.compareForm=null;
		this.re = new RegExp(/(Сравнение, объединение|Сравнение|Обновление)(\s(.*)\s-\s(.*))/);//new RegExp(/(Сравнение, объединение|Сравнение|Обновление)(.*)/);
		this.title = ""

		stdcommands.Config.CompareDBCfg.addHandler(this, "onCompare");
		stdcommands.CfgStore.MergeCfgStoreWithFile.addHandler(this, "onCompare");
    	stdcommands.CfgStore.MergeConfigWithCfgStore.addHandler(this, "onCompare");

        this.mergesObj = [];

    	CompareWatcher._instance = this;
	},

	onCompare:function (cmd) {
		if(!cmd.isBefore)
	    {
	        logger.debug("TrayCompareWatcher is not before start")
	        this.tempPath = TempFilesDir();
            this.mergesObj = [];
	        events.connect(windows, "onDoModal", this);
	    }  else {
	        //Message("Удалить лишние файлы.");
	        try {
                events.disconnect(windows, "onDoModal", this);
             } catch (e) { }
        
	    }
	},

	onDoModal :function(dlgInfo)
	{
        try{
            if(openModalWnd == dlgInfo.stage && dlgInfo.form){
                
                logger.debug(dlgInfo.caption);
                this.modalForm = dlgInfo.form;
                es = this;

                function foundCompareWindows(childs)
                {
                    // При посылке команды окно стает активным, чтобы не нарушить порядок окон, переберем их
                    // в обратном порядке

                    for(var i = childs.count; i-- ; )
                    {
                        var view = childs.item(i)
                        if(view.isContainer != vctNo)
                            foundCompareWindows(view.enumChilds())
                        else
                        {
                            // Возможно, это окно формы, но не открыто на вкладке модуля

                            var r = view.title;
                            logger.debug("find "+r+"re "+es.re);
                            
                            var mathes = r.match(es.re);
                            if (mathes && mathes.length) {
                                es.title = r
                                var caption = ''+windows.caption;
                                if (view.getInternalForm()){
                                    logger.debug("found "+r);
                                    es.compareForm = view.getInternalForm();
                                    return;
                                }
                                    
                                
                            }
                            //if(view.mdObj && view.mdProp && view.mdObj.isPropModule(view.mdProp.id))
                            //    view.mdObj.openModule(view.mdProp.id)  // переключим на вкладку модуля
                        }
                    }
                }

                //Найдем окно сравнени объектов конфигурации. 
                foundCompareWindows(windows.mdiView.enumChilds());
            }    
        } catch(e){
            logger.error(e.description);
        }
	    
	},

    foundCompareWindows:function(childs){
                // При посылке команды окно стает активным, чтобы не нарушить порядок окон, переберем их
                // в обратном порядке

                for(var i = childs.count; i-- ; )
                {
                    var view = childs.item(i)
                    if(view.isContainer != vctNo)
                        this.foundCompareWindows(view.enumChilds())
                    else
                    {
                        // Возможно, это окно формы, но не открыто на вкладке модуля

                        var r = view.title;
                        logger.debug("find "+r+"re "+this.re);
                        
                        var mathes = r.match(this.re);
                        if (mathes && mathes.length) {
                            this.title = r
                            var caption = ''+windows.caption;
                            if (view.getInternalForm()){
                                logger.debug("found "+r);
                                this.compareForm = view.getInternalForm();
                                return;
                            }
                                
                            
                        }
                        //if(view.mdObj && view.mdProp && view.mdObj.isPropModule(view.mdProp.id))
                        //    view.mdObj.openModule(view.mdProp.id)  // переключим на вкладку модуля
                    }
                }
    },

    applyPath:function(){

        for(var i = 0; i<=this.mergesObj.length; i++){
            var mdObj = this.mergesObj[i];
            if(!mdObj)
                continue;

            if (true){
                if(!mdObj.isProcedure){ //Тут просто, это модуль, поэтому можем сразу весь и заливать. 
                    if(mdObj.newText.length>0){
                        mdObj.obj.setModuleText(mdObj.prop, mdObj.newText);
                    }
                } else {
                    //Тут сложнее. Нам надо получить полностью текст модуля и подменить его, по процедурно. 
                    sourceText = mdObj.getText();

                    context = SyntaxAnalysis.AnalyseModule(sourceText, true);
                    var method = context.getMethodByName(mdObj.procedureName);
                    if (!method) {
                        logger.error("Для метода "+mdObj.procedureName+ " в исходном модуле, не нашли процедуры "+mdObj.getTitle());
                        continue;
                    }

                    Lines = sourceText.split("\n");
                    beforeLines = Lines.slice(0, method.StartLine);
                    afterLines = Lines.slice(method.EndLine+1);
                    //debugger;
                    newLines = mdObj.newText;
                    newText = beforeLines.join("\n")+"\n" + mdObj.newText+"\n"+ afterLines.join("\n");

                    
                    mdObj.obj.setModuleText(mdObj.prop, newText);
                }
            }
        }

    },

    compareProcedure:function(){
        if(!this.modalForm || !this.compareForm){
            logger.error("Не найденна модальная форма попроцедурного сравнения");
            logger.error("modal "+!this.modalForm + "compare "+!this.compareForm);
            return;
        }

        try{
            grid = this.modalForm.getControl("Grid").extInterface;
            if(grid.currentRow.getCellAppearance(0).text.length == 0)
                return;
        } catch (e){
            return;
        }

        currentProcedure = grid.currentRow.getCellAppearance(0).text;
        //Определим текущий модуль, полный путь. 
        diff = this.getDiff(currentProcedure);
        if (!diff){
            logger.error("not diff")
            return;
        }

        this.merge(diff, currentProcedure);
    },

    getFullPath:function(parent, indent, fullPath){

        if (parent.parent == null)
            return fullPath;
        
        skips = {
            "Свойства":true,
            "Общие":true 
        }
        
        propsName = {
            "Модуль менеджера":"МодульМенеджера",
            "Модуль объекта":"МодульОбъекта",
            "Модуль набора записей":"МодульНабораЗаписей",
            "Модуль менеджера значения":"МодульМенеджераЗначения",
            "Общие модули":"ОбщиеМодули"
        }

        var name = parent.getCellAppearance(0).text;
        if (skips[name]){

        } else {
            if(propsName[name])
                name = propsName[name];
            
            fullPath = name + (fullPath.length ? "." : "")+fullPath;
        }
        if(parent.parent!=null){
            return this.getFullPath(parent.parent, "", fullPath);
        }
        return fullPath;
    },

    compareObject:function(){
        //Найдем окно сравнени объектов конфигурации. 
        this.foundCompareWindows(windows.mdiView.enumChilds());

        if(!this.compareForm){
            logger.error("Не найденна форма сравнения")
            return;
        }     

        diff = this.getDiff();
        this.diff(diff);
    },

    mergeObject:function(){
        //Найдем окно сравнени объектов конфигурации. 
        this.foundCompareWindows(windows.mdiView.enumChilds());

        if(!this.compareForm){
            logger.error("Не найденна форма сравнения")
            return;
        }     

        diff = this.getDiff();
        this.merge(diff);
    },



	getDiff:function(currentProcedure){
		if(!this.compareForm)
			return;

		
        fullPath = this.getFullPath(this.compareForm.activeControl.extInterface.currentRow, '', '');
        CreateDirectory(this.tempPath + "\\"+fullPath);

        //Message(this.tempPath + "\\"+fullPath);

        leftContainer = 

        containers = {}

        //debugger;

        for(var i = 0, c = metadata.openedCount; i < c; i++)
        {
            var container = metadata.getContainer(i)
            containers[container.identifier]=container;
            logger.debug("opened container:"+container.identifier+":")
        }

        function getMdObj(rootObject, callArray){
            
            found = false;
            mdObject = null;
            if (callArray.length > 3){
                
                //Это по документам, справочникам и т.д. идем.
                //metadataName = Matches[1].slice(0, Matches[1].indexOf('.'));
                try{
                    mdObject1 = rootObject.childObject(callArray[0], callArray[1]);
                    if (mdObject1){
                    	mdObject = 	mdObject1.childObject(callArray[2], callArray[3]);
                    	if (mdObject){
                    		found = true;
                    		return new MdObject(mdObject, callArray[4]);		
                    	}

                    }
         
                } catch(e){
                    
                }
            } else if(callArray.length > 1 ) {
                //Тут по общим модулям пройдемся. 
                try{
                    mdObject1 = rootObject.childObject(callArray[0], callArray[1]);
                    if (mdObject1){
                    	found = true;
                    	return new MdObject(mdObject1, callArray[2]);
                    }
                } catch(e){
                    
                }
            } 
            return;
        }



        diff = new diffObject()
        var mathes = this.title.match(this.re);
		if (mathes && mathes.length) {
            logger.debug(mathes);
			
            if (containers["Старая конфигурация поставщика"]){ //other
                var mdObject = getMdObj(containers["Старая конфигурация поставщика"].rootObject, fullPath.split("."));
                diff.addA(mdObject);

                if(containers[mathes[3]]){ //left

                    var mdObject = getMdObj(containers[mathes[3]].rootObject, fullPath.split(".")); 
                    diff.addB(mdObject);
                }
                if(containers[mathes[4]]){ //right
                    var mdObject = getMdObj(containers[mathes[4]].rootObject, fullPath.split(".")); 
                    diff.addC(mdObject);
                }



            } else {

                if(containers[mathes[3]]){ //left

                    var mdObject = getMdObj(containers[mathes[3]].rootObject, fullPath.split(".")); 
                    diff.addA(mdObject);
                }
                if(containers[mathes[4]]){ //right
                    var mdObject = getMdObj(containers[mathes[4]].rootObject, fullPath.split(".")); 
                    diff.addB(mdObject);
                }

            }

            

            


		} else {
            logger.error("Не нашли в открытом окне конфигурации");
            return ;
        }

        //Новая конфигурация поставщика
        // Старая конфигурация поставщика
        //Заголовок Обновлени Основная конфигурация - Новая конфигурация поставщика. 

        //Теперь самое сложное. Надо перебрать открытые метаданные и найти необходимый нам модуль... 
        // Зачем так сложно, почему не используем октрое окно и текст? Потому-что у нас может быть двухстороннее сравнение. 
        diff.fullPath = fullPath;
        diff.tempPath = this.tempPath
        //debugger;
        return diff;

        //diff.mergeObjects(this.tempPath + "\\"+fullPath, currentProcedure);


	}, 

    merge:function(diff, procedureName){
        
        this.mergesObj.push(diff.mergeObjects(diff.fullPath, procedureName));
    },

    diff:function(diff){
        diff.diffObjects(diff.fullPath);
    }






})

MdObject = stdlib.Class.extend({           
    construct: function (obj, prop, title) {
        this.obj = obj;
        this.prop = prop;
        this.title = null;
        this.md = obj.container;
        this.isForm = (prop == "Форма");
    },
    getText: function() {
        if (this.obj.isPropModule(this.prop))
            return this.obj.getModuleText(this.prop);

        return ""
    },

    saveTextToTempFile: function(path, procedureName){
        if (!path) path = GetTempFileName('txt');

        text = this.convertToText(procedureName);
        var file = v8New("textDocument");
        file.setText(text);
        try{
            file.Write(path);    
        } catch (e) {
            return null;
        }
        
        return path;

    },

    activate: function() {
        this.obj.openModule(this.prop);
        return GetTextWindow();
    },
    getTitle: function() {
        if (!this.title)
        {
            function getMdName(mdObj) {                             
                if (mdObj.parent && mdObj.parent.mdClass.name(1) != 'Конфигурация')
                    return getMdName(mdObj.parent) + '.' + mdObj.mdClass.name(1) + '.' + mdObj.name;
                var cname = mdObj.mdClass.name(1);
                return  (cname ? cname +'.':'') + mdObj.name;
            }
            this.title = getMdName(this.obj) + '.' + this.prop;
        }
        return this.title;
    },

    getForm: function(){
        if (!this.isForm) {
            return null
        }

        var tempPath = GetTempFileName('ssf');

        var ep = this.obj.getExtProp("Форма");
        var file = ep.saveToFile();
        try{
            // создадим хранилище на базе файла. Для управляемых форм тут вывалится в catch
            var stg = v8Files.attachStorage(file);
            // Получим из хранилища содержимое под-файла form
            var form = ep.getForm();
            var file1 = v8New("textDocument");
            file1.setText(' ');
            file1.Write(tempPath);
            file1=null;

            var file = ep.saveToFile(v8files.open("file://"+tempPath,  fomIn | fomOut | fomTruncate));
            file.close();
            isManagmendForm = false
        } catch(e) {
            //logger.error(e.description);
            //isManagmendForm = true;
            file.seek(0, fsBegin)
            var text = file.getString(dsUtf8);
            var file = v8New("textDocument");

            file.setText(text);
            var tempPath = GetTempFileName('txt');
            file.Write(tempPath);
            newPath = GetTempFileName('ssf');
            MoveFile(tempPath, newPath);
            tempPath = newPath;
        }

        return tempPath;
    },

    convertToText:function(procedureName){
        if(procedureName == undefined) return this.getText();

        sourceText = this.obj.getModuleText(this.prop);
        context = SyntaxAnalysis.AnalyseModule(sourceText, true);
        var method = context.getMethodByName(procedureName);
        if (!method) return "";

        Lines = sourceText.split("\n");
        var text = [];
        for (var i = method.StartLine; i<=method.EndLine; i++){
            text.push(Lines[i]);
        }

        return text.join("\n");

    }
});

TextDocObject = stdlib.Class.extend({
    construct: function (txtDoc, title) {
        this.obj = txtDoc;
        this.title = title;
    },
    getText: function() {
        return this.obj.GetText();
    },
    activate: function() {
        this.obj.Show();
        return GetTextWindow();
    },
    getTitle: function() {
        if (!this.title)
            this.title = this.obj.UsedFileName;
        return this.title;
    }
});

diffObject = stdlib.Class.extend({
    construct: function (mergeToolPath) {
        if(!mergeToolPath){
            this.kdiffpath = "C:\\KDiff3\\kdiff3.exe";    
        } else {
            this.kdiffpath = mergeToolPath;
        }
        
        this.A = null;
        this.B = null;
        this.C = null;
    },

    addA : function(obj){
        this.A = obj;
    }, 

    addB : function(obj){
        this.B = obj;
        //this.diffObjects();
    }, 

    addC : function(obj){
        this.C = obj;
    }, 

    diffObjects: function(isModalMode){
        //debugger;
        if (!this.A || !this.B) {
            Message("Не заполенны А или В");
            return;
        }


        if (this.A.isForm = this.B.isForm) {
            //diff form...

            //diff files...
            pathA = this.A.getForm();
            if (!pathA) return;

            pathB = this.B.getForm();
            if (!pathB) return

            v8reader = stdlib.require(stdlib.getSnegopatMainFolder() + "scripts\\dvcs\\diff-v8Reader.js").GetBackend();
            v8reader(pathA, pathB);

        } else {
            //diff files...
            pathA = this.A.saveTextToTempFile();
            if (!pathA) return;

            pathB = this.B.saveTextToTempFile();
            if (!pathB) return

            if (this.C) {
                pathC = this.C.saveTextToTempFile();
                if (!pathC) return    

                pathC = ' '+pathC;
            } else {
                pathC = ''
            }
            

            var cmd = this.kdiffpath +' "'+pathA+'" "'+ pathB +'" '+ pathC;
            //Message(""+cmd);
            ЗапуститьПриложение(cmd, "", false);

        }


    },

    mergeObjects:function(catalogPath, procedureName){
        //debugger;
        if (!this.A || !this.B) {
            Message("Не заполенны А или В");
            return;
        }

        pathA = this.A.saveTextToTempFile(null,procedureName);
        if (!pathA) return;
        //pathA = pathA + " --L1 base-"+catalogPath

        pathB = this.B.saveTextToTempFile(null,procedureName);
        if (!pathB) return

        //pathB = pathB +" --L2 mine-"+catalogPath

        if (this.C) {
            pathC = this.C.saveTextToTempFile(null,procedureName);
            if (!pathC) return    

            pathC = ' '+pathC;
        } else {
            pathC = ''
        }
            //--L1 alias1               Visible name replacement for input file 1 (base).
            //--L2 alias2               Visible name replacement for input file 2.
            //--L3 alias3 

            
            if (procedureName==undefined){
                resultPath = this.tempPath + catalogPath+'\\'+this.A.prop+'.txt';    
            } else {
                resultPath = this.tempPath +catalogPath+'\\'+procedureName+'.txt';
            }

            if (procedureName==undefined){
                var cmd = this.kdiffpath +' "'+pathA+'" "'+ pathB +'" '+ pathC + ' -o '+ '"'+resultPath+'"' ;
            } else {
                var cmd = this.kdiffpath +' "'+pathA+'" "'+ pathB +'" '+ pathC + ' -o '+ '"'+resultPath+'"';
            }
                
            //Message(""+cmd);
            ЗапуститьПриложение(cmd, "", true);

            if(!this.C){
                mdObj = this.A;
            } else {
                mdObj = this.B;
            }

            if(procedureName == undefined){ 
                mdObj.isProcedure = false;
            } else {
                mdObj.isProcedure = true;
                mdObj.procedureName = procedureName;
            }

            //debugger;

            textDoc = v8New("textDocument");
            try{
                textDoc.read(resultPath);
                mdObj.newText = textDoc.GetText();
            } catch(e){
                mdObj.newText = "";
            }

            return mdObj;
    },

    clearCache: function () {
        this.A = null;
        this.B = null;
        this.C = null;
    }

});

function GetCompareWatcher() {
    if (!CompareWatcher._instance)
        new CompareWatcher();
    
    return CompareWatcher._instance;
}

var cht = GetCompareWatcher();

