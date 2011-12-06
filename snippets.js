$engine JScript
$uname snippets
$dname Шаблоны кода
$addin global
$addin stdlib

////////////////////////////////////////////////////////////////////////////////////////
////{ Cкрипт "Шаблоны кода" (snippets.js) для проекта "Снегопат"
////
//// Описание: Расширение возможностей механизма шаблонов кода 1С:Предприятия 8.
//// Автор: Александр Кунташов <kuntashov@gmail.com>, http://compaud.ru/blog
////}
////////////////////////////////////////////////////////////////////////////////////////

global.connectGlobals(SelfScript);
stdlib.require('TextWindow.js', SelfScript);
stdlib.require('StreamLib.js', SelfScript);

////////////////////////////////////////////////////////////////////////////////////////
////{ Макросы
////

function macrosВыполнитьПодстановкуШаблона() {
    var sm = GetSnippetsManager();
    return sm.insertSnippet();
}

function macrosПерезагрузитьШаблоны() {
    var sm = GetSnippetsManager();
    sm.reloadTemplates();
    return true;
}

function macrosНастройкаСпискаШаблонов() {
    var sm = GetSnippetsManager();
    var settingsDialog = new SettingsManagerDialog(sm.settings);
    settingsDialog.Open();
    return true;
}

////} Макросы

////////////////////////////////////////////////////////////////////////////////////////
////{ SnippetsManager
////

function SnippetsManager() {

    SnippetsManager._instance = this;

    this.settings = new SettingsManager(SelfScript, {'TemplateFilesList':v8New('ValueList')});
    this.settings.LoadSettings();    
    
    this._snippets = {};
    this._snippetNames = new Array();
    
    this.paramsManager = new SnippetParametersManager();         
    
    this.loadTemplates();
}

SnippetsManager.prototype.loadTemplates = function() {
    var stFiles = this.settings.current.TemplateFilesList;
    for(var i=0; i<stFiles.Count(); i++)
        this.loadStFile(stFiles.Get(i).Value);
}

SnippetsManager.prototype.reloadTemplates = function() {
    this._snippets = {};
    this._snippetNames = new Array();    
    this.loadTemplates();
}

SnippetsManager.prototype.loadStFile = function(filename) {
    var sp = StreamFactory.CreateParser();
    if (sp.readStreamFromFile(filename))
    {
        var arr = sp.parse()
        if (!arr) return;
        
        // Загружаем шаблоны.
        return this._loadStElement(arr[1]);
            
    }
}

SnippetsManager.prototype._loadStElement = function(stElement) {
    var elCount = stElement[0];
    var elProps = stElement[1];
    if (elProps[1] == 1)
    {
        // Это группа.
        for (var i=2; i<stElement.length; i++)
            this._loadStElement(stElement[i]);
    }
    else 
    {
        // Это элемент.
        this._addSnippet(elProps);        
    }    
}

SnippetsManager.prototype._addSnippet = function(stElement) {
    var snippet = new Snippet(stElement);

    if (!this._snippets[snippet.name])
    {
        this._snippets[snippet.name] = new Array();
        this._snippetNames.push(snippet.name);
    }
        
    this._snippets[snippet.name].push(snippet);
    
    if (snippet.hasMacros())
        this.createSnippetMacros(snippet);        
}

SnippetsManager.prototype.createSnippetMacros = function(snippet)  {
    SelfScript.self['macrosВставить шаблон ' + snippet.macrosName] = function() { 
        snippet.insert(GetTextWindow()); 
    };
}

SnippetsManager.prototype.getSnippetsByName = function(name) {
    return this._snippets[name];
}

SnippetsManager.prototype.insertSnippet = function() {
    var textWindow = GetTextWindow();
    if (!textWindow) return;
    
    var snippetName = this.selectValue(this._snippetNames);
    if (!snippetName)
        return false;
    
    var snippets = this._snippets[snippetName];
    if (snippets && snippets.length)
    {
        snippets[0].insert(textWindow);
        return true;
    }
    
    return false;
}

SnippetsManager.prototype.selectValue = function(values) {
    try
    {
        var sel = new ActiveXObject('Svcsvc.Service')
    }
    catch(e)
    {
        Message("Не удалось создать объект 'Svcsvc.Service'. Зарегистрируйте svcsvc.dll");
        return false;
    }
    //debugger;
   return sel.FilterValue(values.join("\r\n"), 1 | 4, '', 0, 0, 350, 250);    
}

////} SnippetsManager

////////////////////////////////////////////////////////////////////////////////////////
////{ SnippetParametersManager
////

function SnippetParametersManager() {
    this._parameters = {};
}

SnippetParametersManager.prototype.replaceParams = function(template) {
    // TODO
    return template;
}

////} SnippetParametersManager

////////////////////////////////////////////////////////////////////////////////////////
////{ Snippet
////
function Snippet(stElement) {
// ["Имя шаблона 2",0,1,"","Шаблон, включаемый в контекстно меню"]

    this.name = stElement[0];
    this.includeInContextMenu = (stElement[2] == 1);
    this.replacementString = stElement[3];
    
    this.macrosName = '';
    this.template = '';
    
    this._initTemplateText(stElement[4]);
}

Snippet.prototype._initTemplateText = function(tpl) {

    var lines = StringUtils.toLines(tpl);
    if (lines.length > 1)
    {
        // Пример директивы для snippets.js
        //::addMacros("Авторский комментарий: Добавление")
        var matches = lines[0].match(/\/\/\:\:addMacros\(\"(.+?)\"\)/);
        if (matches)
        {
            this.macrosName = matches[1] || this.name;
            // Строку с директивой удаляем из шаблона.
            lines = lines.slice(1);
        }
    }
    this.template = StringUtils.fromLines(lines);
}

Snippet.prototype.hasMacros = function() {
    return (this.macrosName != '');
}

/* Вычисляет относительные координаты положения маркера курсора в шаблоне.
Возвращает анонимный объект с двумя свойствами row - индекс строки и 
col - индекс колонки в строке. Нумерация строк и колонок - с 0.
Возвращает null, если маркер не найден. */
Snippet.prototype.getCursorCoord = function (tpl, isSelected) {    
    /* Если есть выделенный текст, то позиция курсора может быть указана
    в управляющей конструкции путем добавления символа "|" перед
    первым символом подсказки, например <?"|Введите условие">.
    Если выделенного текста нет, то позиция курсора определяется при
    помощи стандартной управляющей конструкции <?>. */
    var cursorMarker = isSelected ? '<?"|': '<?>';
    
    var lines = StringUtils.toLines(tpl);    

    for (var row=0; row<lines.length; row++)
    {
        var col = lines[row].indexOf(cursorMarker);
        if (col >= 0)
            return { 'row': row, 'col': col };
    }
 
    return null;
}

/* Выполняет подстановку значений в шаблон. */
Snippet.prototype.parseTemplateString = function (tpl) {
    /* Пока используем штатный интерпретатор шаблонов 1С,
    доступ к которому нам предоставляет Снегопат. */
    //tpl = this.paramsManager.replaceParams(tpl);  
    return snegopat.parseTemplateString(tpl);
}

/* Выполняет подстановку шаблона в текст */
Snippet.prototype.insert = function (textWindow) {
//debugger;
    var code = this.template;
    
    // Определить, есть ли выделенный текст, который надо будет подставить вместо <?>.
    var selectedText = textWindow.GetSelectedText();
    var selection = textWindow.GetSelection();
    var isSelected = (selectedText != "");    
    
    /* Если в хвосте есть перевод строки (выделены с shift'ом строки и в итоге курсор  
    стоит на следующей строке), то нам этот перевод строки нельзя включать в выделенный
    текст, а надо перенести после вставленного сниппета. */
    var isTrailingNL = StringUtils.endsWith(selectedText, "\n");
    if (isTrailingNL)
        selectedText = selectedText.substr(0, selectedText.length - 1);
        
    /* Определим и запомним отступ. Если выделен текст, то отступ определяем
    по первой строке выделенного блока. В противном случае используем отступ строки,
    в которой был установлен курсор на момент вставки шаблона. */
    var ind = '';
    if (isSelected)
    {
        ind = StringUtils.getIndent(selectedText);
    }
    else 
    {
        var leftPart = textWindow.Range(selection.beginRow, 1, selection.beginRow, selection.beginCol).GetText();
        ind = leftPart.match(/^\s*$/) ? leftPart : '';
    }
     
    var cursorCoords = this.getCursorCoord(code, isSelected);
     
    // Если был выделен текст, то подставим его вместо <?>.
    if (isSelected)
    {
        // Удалим исходный отступ.
        selectedText = StringUtils.shiftLeft(selectedText, ind);
        
        // Отступ, установленный в шаблоне перед <?> надо распространить на весь выделенный текст.
        var re = /^([ |\t]+)\<\?\>/m;
        var matches = code.match(re);
        
        if (matches)
        {
            selectedText = StringUtils.shiftRight(selectedText, matches[1]);
            code = code.replace(re, selectedText);
        }
        else
        {        
            code = code.replace(/\<\?\>/, selectedText);
        }
        
        /* Удалим альтернативный маркер позиции курсора (если он присутствует), причем
        вместе с управляющей конструкцией, чтобы подстановка по шаблону для нее не выполнялась. */
        code = code.replace(/\<\?\"\|.*?\".*?\>/, '');
    }
    else
    {
        /* Если в момент вставки шаблона не было выделено текста, то удалим штатный маркер 
        позиции курсора (если вдруг он присутствует), курсор мы будем позиционировать самостоятельно. */
        code = code.replace(/\<\?\>/, '');
    }
        
    // Выполним подстановку шаблонов 1С.
    code = this.parseTemplateString(code); 
        
    // Применим отступ к полученному коду сниппета.
    code = StringUtils.shiftRight(code, ind);
    
    /* Если вставляется многострочный блок в текущую позицию курсора и никакого 
    текста не выделено, то надо очистить отступ в первой строке вставляемого  
    блока, чтобы он не дублировался. */
    if (!isSelected && ind != '')
        code = code.replace(new RegExp('^' + ind), '');
    
    // Вернем перевод строки в конец вставляемого текста (если он был в конце выделенного блока).
    if (isTrailingNL)
        code += "\n";
        
    // Заменить выделенный текст или вставить текст в текущую позицию.
    textWindow.SetSelectedText(code);
    
    /* Если в тексте был найден маркер положения курсора, то выполним 
    установку курсора в позицию маркера, рассчитав его абсолютные координаты. */    
    if (cursorCoords)
    {
        var row = selection.beginRow + cursorCoords.row;
        var col = selection.beginCol + cursorCoords.col + ind.length - (isSelected ? 0 : 2);
        textWindow.SetCaretPos(row, col);
    }
}

////} Snippet

////////////////////////////////////////////////////////////////////////////////////////
////{ SettingsManager(script, defaults)
////

function SettingsManager(script, defaults) {
    this.rootPath = script.uniqueName;
    
    var emptySettings = {};
    this.DefaultSettings = defaults || emptySettings;
        
    for(var setting in this.DefaultSettings)
        profileRoot.createValue(this.GetFullSettingPath(setting), this.DefaultSettings[setting], pflSnegopat);
                
    this.current = {};
    
    for(var setting in this.DefaultSettings)
        this.current[setting] = profileRoot.getValue(this.GetFullSettingPath(setting));
}

SettingsManager.prototype.ReadFromForm = function(form) {
    for(var setting in this.current)
        this.current[setting] = form.Controls[setting].Value;
}

SettingsManager.prototype.ApplyToForm = function(form) {

    for(var setting in this.current)
    {
        var value = this.current[setting];
        
        if (value === undefined || value === null)
            value = this.DefaultSettings[setting];
            
        form.Controls[setting].Value = value;
    }
}

SettingsManager.prototype.GetFullSettingPath = function(settingName) {
    return this.rootPath + "/" + settingName;
}

SettingsManager.prototype.LoadSettings = function() {
    this.current = {};
    
    for(var setting in this.DefaultSettings)
        this.current[setting] = profileRoot.getValue(this.GetFullSettingPath(setting));
        
    return this.current;
}

SettingsManager.prototype.SaveSettings = function() {
    for(var setting in this.current)
        profileRoot.setValue(this.GetFullSettingPath(setting), this.current[setting]);
}

////} SettingsManager

////////////////////////////////////////////////////////////////////////////////////////
////{ SettingsManagerDialog
////

function SettingsManagerDialog(settings) {
    this.settings = settings;
    this.form = loadScriptForm("scripts\\snippets.settings.ssf", this);
    this.settings.ApplyToForm(this.form);
}

SettingsManagerDialog.prototype.Open = function() {
  this.form.Open();
}

SettingsManagerDialog.prototype._saveSettings = function() {
    
    this.settings.ReadFromForm(this.form);
    this.settings.SaveSettings();
    this.form.Modified = false;
    
    // Перезагрузим шаблоны после изменения настроек.
    var sm = GetSnippetsManager();
    sm.reloadTemplates();
}

SettingsManagerDialog.prototype.CmdBarSaveAndClose = function(button) {
    this._saveSettings();
    this.form.Close();
}

SettingsManagerDialog.prototype.CmdBarSave = function (button) {
    this._saveSettings();
}

SettingsManagerDialog.prototype.CmdBarClose = function (button) {        
    this.form.Close();
}

SettingsManagerDialog.prototype.CmdBarAbout = function (button) {
    RunApp('http://snegopat.ru');
}

SettingsManagerDialog.prototype.CmdBarStListAddStFile = function (button) {
    
    var dlg = v8New('FileDialog',  FileDialogMode.Open);
    dlg.Multiselect = true;
    dlg.CheckFileExist = true;
    dlg.Filter = "Файлы шаблонов (*.st)|*.st|Все файлы|*";
    
    if (dlg.Choose())
    {
        this.form.Modified = true;
        
        for(var  i=0; i<dlg.SelectedFiles.Count(); i++)
        {   
            var path = dlg.SelectedFiles.Get(i);
            if (!this.form.TemplateFilesList.FindByValue(path))
                this.form.TemplateFilesList.Add(path);
        }
    }
}

SettingsManagerDialog.prototype.CmdBarStListDeleteStFile = function (button) {
    var curRow = this.form.Controls.TemplateFilesList.CurrentRow;
    if (curRow)
    {
        this.form.TemplateFilesList.Delete(curRow);
        this.form.Modified = true;        
    }
}

SettingsManagerDialog.prototype.OnOpen = function() {
}

SettingsManagerDialog.prototype.BeforeClose = function(Cancel, StandardHandler) {

    StandardHandler.val = false;

    if (this.form.Modified)
    {
        var answ = DoQueryBox("Настройки были изменены. Сохранить?", QuestionDialogMode.YesNoCancel);
        
        if (answ == DialogReturnCode.Cancel)
        {
            Cancel.val = true;
            return;
        }
            
        if (answ == DialogReturnCode.Yes)
            this._saveSettings();                
    }	
    
    Cancel.val = false;
}

////} SettingsManagerDialog 

////////////////////////////////////////////////////////////////////////////////////////
////{ Startup
////
function GetSnippetsManager() {
    if (!SnippetsManager._instance)
        new SnippetsManager();
        
    return SnippetsManager._instance;
}

GetSnippetsManager();
////} Startup 