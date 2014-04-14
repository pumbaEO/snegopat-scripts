$engine JScript
$uname extDiffManager
$dname Расширенный diff для попроцедурного сравнения. 
$addin global
$addin stdlib
$addin stdcommands

global.connectGlobals(SelfScript)

stdlib.require('ScriptForm.js', SelfScript);
stdlib.require('log4js.js', SelfScript);

var logger = Log4js.getLogger(SelfScript.uniqueName);
var appender = new Log4js.BrowserConsoleAppender();
appender.setLayout(new Log4js.PatternLayout(Log4js.PatternLayout.TTCC_CONVERSION_PATTERN));
appenders = new Array();
appenders.push(appender);
logger.setAppender(appenders);
logger.setLevel(Log4js.Level.ERROR);

SelfScript.self['macrosНастройка'] = function() {
    var sm = GetCompareWatcher();
    sm.changeSettings();
    return true;
}

CompareWatcher = stdlib.Class.extend({

	modalForm: null,
	compareForm: null,
	re : new RegExp(/(Сравнение, объединение|Сравнение|Обновление)(\\s(.*)\\s-\\s(.*))/),

	construct:function(){

		this.modalForm=null;
		this.compareForm=null;
		this.re = new RegExp(/(Сравнение, объединение|Сравнение|Обновление)(\\s(.*)\\s-\\s(.*))/);//new RegExp(/(Сравнение, объединение|Сравнение|Обновление)(.*)/);
		this.title = ""

		stdcommands.Config.CompareDBCfg.addHandler(this, "onCompare");
		stdcommands.CfgStore.MergeCfgStoreWithFile.addHandler(this, "onCompare");
    	stdcommands.CfgStore.MergeConfigWithCfgStore.addHandler(this, "onCompare");

    	CompareWatcher._instance = this;
	},

	onCompare:function (cmd) {
		if(!cmd.isBefore)
	    {
	        //Message("TrayCompareWatcher is not before start")
	        this.tempPath = v8New("TempFilesDir");
	        events.connect(windows, "onDoModal", this);
	    }  else {
	        Message("Удалить лишние файлы.");
	        try {
                events.disconnect(windows, "onDoModal", this);
             } catch (e) { }
        
	    }
	},

	onDoModal :function((dlgInfo)
	{
	    if(openModalWnd == dlgInfo.stage && dlgInfo.form){
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
					    
					    var mathes = r.match(es.re);
					    if (mathes && mathes.length) {
					    	es.title = r
					        var caption = ''+windows.caption;
					        if (view.getInternalForm()){
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
	        

	},

	compareCurrentRow:function(){
		if(!this.modalForm || !this.compareForm)
			return;

		try{
			grid = this.modalForm.getControl("Grid").extInterface;
			if(grid.currentRow.getCellAppearance(0).text.length == 0)
				return;
		} catch (e){
			return;
		}
		currentProcedure = grid.currentRow.getCellAppearance(0).text;
		//Определим текущий модуль, полный путь. 

		function forAllRows(parent, indent, fullPath)
        {

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
        		return forAllRows(parent.parent, "", fullPath);
        	}
        	return fullPath;
        }

        fullPath = forAllRows(this.compareForm.activeControl.extInterface.currentRow, '', '');
        CreateDirectory(this.tempPath + "\\"+fullPath);

        Message(this.tempPath + "\\"+fullPath);

        leftContainer = 

        containers = {}

        for(var i = 0, c = metadata.openedCount; i < c; i++)
        {
            var container = metadata.getContainer(i)
            containers[container.identifier]=container;
            //choice.Add(container, container.identifier)
            //Message(container.identifier);
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
		                    	return new MdObject(mdObject1, callArray[3]);
		                    }
		                } catch(e){
		                    
		                }
		            } 
		            return;
        }

        diff = new diffObject()
        var mathes = this.title.match(this.re);
		if (mathes && mathes.length) {
			if(containers[mathes[2]]){ //left
				diff.addA(getMdObj(containers[mathes[2]], fullPath.split(".")));
			}
			if(containers[mathes[3]]){ //left
				diff.addB(getMdObj(containers[mathes[3]], fullPath.split(".")));
			}
		}


        //Теперь самое сложное. Надо перебрать открытые метаданные и найти необходимый нам модуль... 
        // Зачем так сложно, почему не используем октрое окно и текст? Потому-что у нас может быть двухстороннее сравнение. 




	}, 




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
        return this.obj.getModuleText(this.prop);
    },

    saveTextToTempFile: function(path){
        if (!path) path = GetTempFileName('txt');

        text = this.getText();
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
        this.obj.openModule(this.prop.id);
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
            this.title = getMdName(this.obj) + '.' + this.prop.name(1);
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
    construct: function (bla) {
        this.kdiffpath = "d:\\WORK\\snegopat\\local\\KDiff3\\kdiff3.exe";
        this.A = null;
        this.B = null;
        this.C = null;
    },

    addA : function(obj){
        this.A = obj;
    }, 

    addB : function(obj){
        this.B = obj;
        this.diffObjects();
    }, 

    addC : function(obj){
        this.C = obj;
    }, 

    diffObjects: function(){
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
                pathC = +this.C.saveTextToTempFile();
                if (!pathC) return    

                pathC = ' '+pathC;
            } else {
                pathC = ''
            }
            

            var cmd = this.kdiffpath +' "'+pathA+'" "'+ pathB +'" '+ pathC + ' -o '+ '"d:\\work\\temp\\'+this.A.getTitle()+'.txt"';
            Message(""+cmd);
            ЗапуститьПриложение(cmd, "", true);

        }


    },

    clearCache: function () {
        this.A = null;
        this.B = null;
        this.C = null;
    }

});

function GetCompareWatcher() {
    if (!SubCompareWatcher._instance)
        new CompareWatcher();
    
    return CompareWatcher._instance;
}

var cht = GetCompareWatcher();

