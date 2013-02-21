$engine JScript
$uname choiceSubSystem
$dname Выбрать подсистему
$addin stdlib
$addin hotkeys

// (c) Сосна Евгений <shenja@sosna.zp.ua>
// Скрипт позволяет быстрее выбрать нужную подсистему при отборе по подсистемам
// 



stdlib.require("SelectValueDialog.js", SelfScript);
stdlib.require('SettingsManagement.js', SelfScript);
global.connectGlobals(SelfScript);

////////////////////////////////////////////////////////////////////////////////////////
////{ Макросы
////

SelfScript.self['macrosНастройка'] = function() {
    var sm = GetSubSystemFilter();
    sm.changeSettings();
    return true;
}

SelfScript.self['macrosОтфильтровать подсистемы'] = function() {
    var sm = GetSubSystemFilter();
    sm.filterOnSubSystem();
    return true;
}

SelfScript.self['macrosПоиск подсистемы'] = function() {
    var sm = GetSubSystemFilter();
    sm.findSubSystem();
    return true;
}





/* Возвращает название макроса по умолчанию - вызывается, когда пользователь 
дважды щелкает мышью по названию скрипта в окне Снегопата. */
function getDefaultMacros() {
    return 'Настройка';
}

////} Макросы

SubSystemFilter = stdlib.Class.extend({


    settingsRootPath : 'subSystemFilter',
    
    defaultSettings : {
            'useEnter': false, 
            'clearFilter':false
    },


    construct : function () {    
        
        this.treeSubSystems = null;
        this.settings = SettingsManagement.CreateManager(this.settingsRootPath, this.defaultSettings);
        this.loadSettings();

        this.md = metadata.current;
        this.mdId = this.md.identifier;

        SubSystemFilter._instance = this;
    },

    loadSettings:function(){
        this.settings.LoadSettings();
        events.connect(windows, "onDoModal", this)

    },

    changeSettings : function(){
        var values = v8New('СписокЗначений');
        values.Add(0, 'Сразу устанавливать фильтр (после установки фильтра Enter)');
        values.Add(1, 'Только отметить необходимую систему');
        var dlg = new SelectValueDialog("Выберите вариант установки фильтра!", values);
        if (dlg.selectValue()) {
            this.settings.current.useEnter = (dlg.selectedValue==1)?true:false;
            this.settings.SaveSettings();                        
        }
        
        var values = v8New('СписокЗначений');
        values.Add(0, 'Только отмечать новый выбор подсистемы');
        values.Add(1, 'Очищать фильтр перед установкой нового фильтра');
        var dlg = new SelectValueDialog("Выберите вариант установки фильтра!", values);
        if (dlg.selectValue()) {
            this.settings.current.clearFilter = (dlg.selectedValue==1)?true:false;
            this.settings.SaveSettings();                        
        }
        
    }, 


    onDoModal:function(dlgInfo){
        if(dlgInfo.caption == "Отбор по подсистемам")
        {
            if(dlgInfo.stage == openModalWnd)
            {
                this.filterOnSubSystem();
                
                hotkeys.AddHotKey("Ctrl+F", "choiceSubSystem", "Поиск подсистемы");
            } else if (dlgInfo.stage == afterDoModal){
                for(var i = 0; i < HotKeys.count; i++)
                {
                    var hk = HotKeys.item(i);
                    Команда = hk.addin + "::" + hk.macros
                    if (Команда.indexOf("choiceSubSystem::Поиск подсистемы")!=-1){
                        try {
                            HotKeys.remove(i);
                            hotkeys.AddHotKey("Ctrl+F", "ExtendedSearch", "Найти текст");
                        } catch (e) {}
                    }
                }
            }
        }
    },
    
    walkSubSystems:function(){
        
        var md = this.md;
        this.treeSubSystems = v8New("ValueTree");
        this.treeSubSystems.Columns.Add("Имя");
        if (!md){
            return;
        }
        try{
            if(md.rootObject.childObjectsCount("Подсистемы") > 0)
                var newRow = this.treeSubSystems.Rows.Add();
                newRow.Имя = "Подсистемы";
                var mdObj = md.rootObject;
                for(var i = 0, c = mdObj.childObjectsCount("Подсистемы"); i < c; i++){
                    mdSubs = mdObj.childObject("Подсистемы", i);
                    this.parseSubSystems(mdSubs, newRow);
                }
                
        }catch(e){
           Message("Не удалось распарсить подсистемы"+e.description);
        }
    
    },
    
    parseSubSystems: function (mdObj, row) {
        // Получим и покажем класс объекта
        var mdc = mdObj.mdclass;
        var Имя = toV8Value(mdObj.property(0)).presentation();
        var newRow = row.Rows.Add();
        newRow.Имя = ""+Имя;
        
        // Перебираем классы потомков (например у Документа это Реквизиты, ТабличныеЧасти, Формы)
        for(var i = 0; i < mdc.childsClassesCount; i++)
        {
            var childMdClass = mdc.childClassAt(i)
            
            for(var chldidx = 0, c = mdObj.childObjectsCount(i); chldidx < c; chldidx++)
                this.parseSubSystems(mdObj.childObject(i, chldidx), newRow)
        }
    }, 

    filterDialog:function(){
        
        var selectedRow = null;
        if (this.mdId!=this.md.identifier){
            this.walkSubSystems();
            this.mdId = this.md.identifier;
        }
        if (!this.treeSubSystems)
            this.walkSubSystems();
        if (this.treeSubSystems.Rows.Count()>0){
            var curRow = this.treeSubSystems.Rows.Get(0);
            var indent = "";
            var index = 0;
            var valuelist = v8New("ValueList");
            var es = this;
            (function (row,valuelist,indent) {
                for (var i = 0; i<row.Rows.Count(); i++){
                    var curRow = row.Rows.Get(i);
                    index = index+1;
                    valuelist.Add(index, ""+indent+curRow.Имя);
                    if (curRow.Rows.Count()>0){
                        arguments.callee(curRow, valuelist, indent+"    ");
                    }
                }
            
            })(curRow, valuelist, indent);    

            var dlg = new SelectValueDialog("Какую подсистему желаете отобрать?", valuelist);
            
            result = dlg.selectValue();
            selectedRow = dlg.selectedValue;
        }
        return selectedRow
    },
    
    findSubSystem:function(){
        selectedRow = this.filterDialog();
        
        if (selectedRow!=undefined){
            var sk = ""
            sk = "{HOME}";
            
            for (var i = 0; i<selectedRow; i++) {
                    sk += "{DOWN}"
                };
                //Message("sk:"+sk);
                new ActiveXObject("WScript.Shell").SendKeys(sk);
                new ActiveXObject("WScript.Shell").SendKeys(" ");
            
        } 
        
    },
    
    filterOnSubSystem: function(){
        
        choice = v8New("СписокЗначений");
        for(var i = 0, c = metadata.openedCount; i < c; i++)
        {
            var container = metadata.getContainer(i)
            try{
                if(container.rootObject.childObjectsCount("Подсистемы") > 0){
                    if (container == metadata.ib){
                        continue;                        
                    }
                    choice.Add(container, container.identifier)
                }
                 
            }catch(e){}
        }

        if(choice.Count() == 0)
        {
            Message("Нет конфигураций с подсистемами...")
            return null
        }
        else if(choice.Count() == 1)
            choice = choice.Get(0)
        else
            choice = choice.ChooseItem("Выберите конфигурацию для отбора подсистем");
        if(!choice)
            return null

        var container = choice.Value
        this.md = container;
        //var mdObj = container.rootObject
        selectedRow = this.filterDialog();
        if (selectedRow!=undefined){
            var sk = ""
            sk = "{HOME}";
            
            if (this.settings.current.clearFilter){
                sk+=" ";
            }
            for (var i = 0; i<selectedRow; i++) {
                    sk += "{DOWN}"
                };
                //Message("sk:"+sk);
                new ActiveXObject("WScript.Shell").SendKeys(sk);
                new ActiveXObject("WScript.Shell").SendKeys(" ");
                if (this.settings.current.useEnter){
                    new ActiveXObject("WScript.Shell").SendKeys("~");
                }
        } 
    }

})


function GetSubSystemFilter() {
    if (!SubSystemFilter._instance)
        new SubSystemFilter();
    
    return SubSystemFilter._instance;
}


var cht = GetSubSystemFilter();
