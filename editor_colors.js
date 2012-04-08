$engine JScript
$uname editor_colors
$dname Настройка профилей цветов редактора
$addin global
$addin stdlib

/*
 * (c) Сосна Евгений <shenja@sosna.zp.ua>
 *  По мотивам http://infostart.ru/public/122391/
 * Есть 3 схемы по умолчанию : типовая, темная, светлая. 
 */

stdlib.require('SettingsManagement.js', SelfScript);

global.connectGlobals(SelfScript);

var settings; // Хранит настройки скрипта (экземпляр SettingsManager'а).


function SetColorCategory(ColorTable) {

    for(var rows = new Enumerator(ColorTable); !rows.atEnd(); rows.moveNext())
    {
        var row = rows.item()
        profileRoot.setValue("ModuleColorCategory/" + row.Категория, row.Цвет)
    }

}


SelfScript.Self['macrosПрименить цветовую схему'] = function () {
    
    var form = {"ListForProfileColors":v8New("ValueList")};
    settings.ApplyToForm(form);
    if (form["ListForProfileColors"].Count() > 0) {
        choice = form["ListForProfileColors"].ChooseItem("Выберете цветовую схему ");
        if (choice!=undefined) {
            SetColorCategory(choice.value);
            MessageBox("Для вступления изменений в силу перезапустите Конфигуратор", mbOk | mbIconInformation, "Снегопат")
            
        }
    }
}

SelfScript.Self['macrosРедактировать цветовую схему'] = function () {
    
    var form = {"ListForProfileColors":v8New("ValueList")};
    settings.ApplyToForm(form);
    if (form["ListForProfileColors"].Count() > 0) {
        choice = form["ListForProfileColors"].ChooseItem("Выберете цветовую схему ");
        if (choice!=undefined) {
            var dsForm = new ColorEditorForm(choice.value);
            choice.value = dsForm.ShowDialog();
            settings.ReadFromForm(form);
            settings.SaveSettings();
            
        }
    }
}

SelfScript.Self['macrosДобавить цветовую схему'] = function () {
    
    var form = {"ListForProfileColors":v8New("ValueList")};
    settings.ApplyToForm(form);
    var vbs = addins.byUniqueName("vbs").object
    vbs.var0 = ""; vbs.var1 = "Введите новое имя схемы"; vbs.var2 = 0, vbs.var3 = false;
    if (vbs.DoEval("InputString(var0, var1, var2, var3)")) {
            var message  = vbs.var0;
            name = message;
    }
    
    if (name.length > 0 ) {
        var ValueTable = v8New("ValueTable");
        ValueTable.Колонки.Добавить("Категория");
        ValueTable.Колонки.Добавить("Цвет");
        НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Keywords"; НоваяСтрока.Цвет = v8New("Цвет", 255, 0, 0);
        НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Numerics"; НоваяСтрока.Цвет = v8New("Цвет", 0, 0, 0);
        НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Strings"; НоваяСтрока.Цвет = v8New("Цвет", 0, 0, 0);
        НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Dates"; НоваяСтрока.Цвет = v8New("Цвет", 0, 0, 0);
        НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Identifiers"; НоваяСтрока.Цвет = v8New("Цвет", 0, 0, 255);
        НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Operators"; НоваяСтрока.Цвет = v8New("Цвет", 255, 0, 0);
        НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Comments"; НоваяСтрока.Цвет = v8New("Цвет", 0, 128, 0);
        НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Preprocessor"; НоваяСтрока.Цвет = v8New("Цвет", 150, 50, 0);
        НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Others"; НоваяСтрока.Цвет = v8New("Цвет", 0, 0, 0);
        НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Background"; НоваяСтрока.Цвет = v8New("Цвет", 255, 255, 255);
        form["ListForProfileColors"].add(ValueTable, name);
        
        settings.ReadFromForm(form);
        settings.SaveSettings();
    }
}

SelfScript.Self['macrosУдалить цветовую схему'] = function () {
    
    var form = {"ListForProfileColors":v8New("ValueList")};
    settings.ApplyToForm(form);
    if (form["ListForProfileColors"].Count() > 0) {
        choice = form["ListForProfileColors"].ChooseItem("Выберете цветовую схему для удаления");
        if (choice!=undefined) {
            form["ListForProfileColors"].Delete(choice);
            settings.ReadFromForm(form);
            settings.SaveSettings();
            
        }
    }
}


/* Возвращает название макроса по умолчанию - вызывается, когда пользователь 
дважды щелкает мышью по названию скрипта в окне Снегопата. */
function getDefaultMacros() {
    return 'Применить цветовую схему';
}

////////////////////////////////////////////////////////////////////////////////////////
////{ Форма редактирования цветов схемы
////

function ColorEditorForm(settings) {
    this.settings = settings;
    this.form = loadScriptForm("scripts\\editor_colors.ssf", this);
    
}

ColorEditorForm.prototype.ShowDialog = function() {
    return this.form.DoModal();
}

ColorEditorForm.prototype["ПриОткрытии"] = function() {
    var qec = this.settings;
    for(var i = 0; i<qec.Количество(); i++)
    {
        
        var row = this.form.Категории.Добавить();
        row.Категория = qec.Получить(i).Категория;
        row.Цвет = qec.Получить(i).Цвет;
    }
}

ColorEditorForm.prototype.Save = function () {
    this.settings.Clear();
    for(var rows = new Enumerator(this.form.Категории); !rows.atEnd(); rows.moveNext())
    {
        
        
        var row = rows.item()
        var newrow = this.settings.Add();
        newrow.Категория = row.Категория; newrow.Цвет = row.Цвет;
    }

}

ColorEditorForm.prototype["Записать"] = function(Кнопка) {
    return this.Save();
    // MessageBox("Для вступления изменений в силу перезапустите Конфигуратор", mbOk | mbIconInformation, "Снегопат")
}

ColorEditorForm.prototype["ЗаписатьИЗакрыть"] = function(Кнопка) {
    this.Save();
    this.form.Close(this.settings);
    // MessageBox("Для вступления изменений в силу перезапустите Конфигуратор", mbOk | mbIconInformation, "Снегопат")
}

ColorEditorForm.prototype["ПриВыводеСтроки"] = function(Элемент, ОформлениеСтроки, ДанныеСтроки) {
    
    ОформлениеСтроки.val.Ячейки.Показ.ЦветФона = ДанныеСтроки.val.Цвет
    
    // MessageBox("Для вступления изменений в силу перезапустите Конфигуратор", mbOk | mbIconInformation, "Снегопат")
}

////
////} Форма редактирования цветов схемы
////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////
////{ Start up
////

var СписокТем = v8New("ValueList");

//Светлая схема.
var ValueTable = v8New("ValueTable");
ValueTable.Колонки.Добавить("Категория"); ValueTable.Колонки.Добавить("Цвет");
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Keywords"; НоваяСтрока.Цвет = v8New("Цвет", 210, 76, 21);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Numerics"; НоваяСтрока.Цвет = v8New("Цвет", 182, 137, 0);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Strings"; НоваяСтрока.Цвет = v8New("Цвет", 76, 164, 156);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Dates"; НоваяСтрока.Цвет = v8New("Цвет", 133, 153, 0);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Identifiers"; НоваяСтрока.Цвет = v8New("Цвет", 37, 139, 211);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Operators"; НоваяСтрока.Цвет = v8New("Цвет", 212, 47, 51);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Comments"; НоваяСтрока.Цвет = v8New("Цвет", 147, 161, 161);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Preprocessor"; НоваяСтрока.Цвет = v8New("Цвет", 213, 53, 132);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Others"; НоваяСтрока.Цвет = v8New("Цвет", 137, 154, 51);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Background"; НоваяСтрока.Цвет = v8New("Цвет", 255, 251, 240);

СписокТем.add(ValueTable, "Светлая цветовая схема");

//Темная цветовая схема.
var ValueTable = v8New("ValueTable");
ValueTable.Колонки.Добавить("Категория"); ValueTable.Колонки.Добавить("Цвет");
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Keywords"; НоваяСтрока.Цвет = v8New("Цвет", 210, 76, 21);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Numerics"; НоваяСтрока.Цвет = v8New("Цвет", 182, 137, 0);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Strings"; НоваяСтрока.Цвет = v8New("Цвет", 76, 164, 156);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Dates"; НоваяСтрока.Цвет = v8New("Цвет", 133, 153, 0);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Identifiers"; НоваяСтрока.Цвет = v8New("Цвет", 37, 139, 211);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Operators"; НоваяСтрока.Цвет = v8New("Цвет", 212, 47, 51);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Comments"; НоваяСтрока.Цвет = v8New("Цвет", 147, 161, 161);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Preprocessor"; НоваяСтрока.Цвет = v8New("Цвет", 213, 53, 132);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Others"; НоваяСтрока.Цвет = v8New("Цвет", 137, 154, 51);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Background"; НоваяСтрока.Цвет = v8New("Цвет", 0, 43, 54);
СписокТем.add(ValueTable, "Темная цветовая схема");

var ValueTable = v8New("ValueTable");
ValueTable.Колонки.Добавить("Категория"); ValueTable.Колонки.Добавить("Цвет");
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Keywords"; НоваяСтрока.Цвет = v8New("Цвет", 255, 0, 0);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Numerics"; НоваяСтрока.Цвет = v8New("Цвет", 0, 0, 0);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Strings"; НоваяСтрока.Цвет = v8New("Цвет", 0, 0, 0);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Dates"; НоваяСтрока.Цвет = v8New("Цвет", 0, 0, 0);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Identifiers"; НоваяСтрока.Цвет = v8New("Цвет", 0, 0, 255);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Operators"; НоваяСтрока.Цвет = v8New("Цвет", 255, 0, 0);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Comments"; НоваяСтрока.Цвет = v8New("Цвет", 0, 128, 0);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Preprocessor"; НоваяСтрока.Цвет = v8New("Цвет", 150, 50, 0);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Others"; НоваяСтрока.Цвет = v8New("Цвет", 0, 0, 0);
НоваяСтрока = ValueTable.Add(); НоваяСтрока.Категория = "Background"; НоваяСтрока.Цвет = v8New("Цвет", 255, 255, 255);
СписокТем.add(ValueTable, "Настройкам по умолчанию от 1С");

settings = SettingsManagement.CreateManager('ProfileEditorColors', { 'ListForProfileColors': СписокТем })
settings.LoadSettings();

////
////} Start up
////////////////////////////////////////////////////////////////////////////////////////

