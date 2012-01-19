$engine JScript
$uname Refactoring
$dname Рефакторинг
$addin global
$addin stdlib

////////////////////////////////////////////////////////////////////////////////////////
////{ Cкрипт "Рефакторинг" (refactoring.js) для проекта "Снегопат"
////
//// Описание: Реализует простейшие инструменты рефакторинга.
//// Автор: Александр Кунташов <kuntashov@gmail.com>, http://compaud.ru/blog
////}
////////////////////////////////////////////////////////////////////////////////////////

stdlib.require('TextWindow.js', SelfScript);
stdlib.require('SyntaxAnalysis.js', SelfScript);

////////////////////////////////////////////////////////////////////////////////////////
////{ Макросы
////

SelfScript.self['macrosВыделить метод (extract method)'] = function () {
    refactor(ExtractMethodRefactoring);
}

SelfScript.self['macrosПоказать список процедур и функций модуля'] = function () {
    var tw = GetTextWindow();
    if (!tw) return;
    var module = SyntaxAnalysis.AnalyseTextDocument(tw);
    var methList = new MethodListForm(module);
    if (methList.selectMethod())
        Message(methList.SelectedMethod.Name);
}

SelfScript.self['macrosСоздать заглушку для несуществующего метода'] = function () {
    refactor(CreateMethodStubRefactoring, true);
}

////} Макросы

function refactor(refactorerClass, withoutSelection) {
    
    var tw = GetTextWindow();
    if (!tw) return;
    
    var selText = tw.GetSelectedText();
    if (!selText && !withoutSelection) 
    {
        Message("Не выделен текст, к которому применяется рефакторинг!");
        return;
    }
    
    var module = SyntaxAnalysis.AnalyseTextDocument(tw);
    var refactorer = new refactorerClass(module);
    refactorer.refactor(selText);
}

////////////////////////////////////////////////////////////////////////////////////////
////{ MethodListForm
////

function MethodListForm(module) {
    this.module = module;
    this.form = loadScriptForm(SelfScript.fullPath.replace(/\.js$/, '.methodList.ssf'), this);
    this.form.Controls.MethodList.Value = this.module.getMethodsTable();
    this.SelectedMethod = undefined;
}

MethodListForm.prototype.selectMethod = function () {
    this.SelectedMethod = this.form.DoModal();
    return this.SelectedMethod ? true : false;
}

MethodListForm.prototype.MethodListSelection = function (Control, SelectedRow, Column, DefaultHandler) {
    this.form.Close(SelectedRow.val._method);
}

MethodListForm.prototype.MethodListOnRowOutput = function (Control, RowAppearance, RowData) {
    // Вставить содержимое обработчика.
}

////} MethodListForm

////////////////////////////////////////////////////////////////////////////////////////
////{ CreateMethodStubRefactoring
////

function CreateMethodStubRefactoring(module) {

    this.module = module;
    this.textWindow = this.module.textWindow;
}

CreateMethodStubRefactoring.prototype.refactor = function (selectedText) {
    
    var methodName, methodSignature, matches;
    
    methodName = this.textWindow.GetWordUnderCursor();
    if (!methodName)
        return;
    
    var method_call_proc = new RegExp("(?:;\\s*|^\\s*)" + methodName + '(\\(.+?\\))');
    var method_call_func = new RegExp(methodName + "(\\(.*?\\))");
    
    var line = this.textWindow.GetLine(this.textWindow.GetCaretPos().beginRow);
    
    var matches = line.match(method_call_proc);
    var isProc = (matches != null);
    
    if (!isProc)
    {
        matches = line.match(method_call_func);
        if (!matches)
            return;
    }
    
    methodSignature = methodName + matches[1];
    
    var procTemplate = "\n"  
    + "Процедура ИмяМетода()\n"
    + "\t//TODO: Добавьте исходный код процедуры.\n" 
    + "КонецПроцедуры\n";

    var funcTemplate = "\n" 
    + "Функция ИмяМетода()\n"
    + "\t//TODO: Добавьте исходный код функции.\n" 
    + "\tВозврат Неопределено\n"
    + "КонецФункции\n";
    
    var stubCode = isProc ? procTemplate : funcTemplate;
    stubCode = stubCode.replace('ИмяМетода()', methodSignature);
    
    var methodList = new MethodListForm(this.module);
    if (methodList.selectMethod())
    {
        var insertLineIndex = methodList.SelectedMethod.EndLine + 1;
        this.textWindow.InsertLine(insertLineIndex + 1, stubCode);
    }
}

////} CreateMethodRefactoring

////////////////////////////////////////////////////////////////////////////////////////
////{ ExtractMethodRefactoring
////

function ExtractMethodRefactoring(module) {
    this.module = module;
    this.form = loadScriptForm(SelfScript.fullPath.replace(/\.js$/, '.extractMethod.ssf'), this);    
    this.Params = this.form.Params;
    this.ReturnValue = this.form.ReturnValue;
    this.SignaturePreview = this.form.SignaturePreview;
}

ExtractMethodRefactoring.prototype.refactor = function (selectedText) {

    // 1. Определить переменные внутри выделенного блока кода (распарсить его).
    var extractedCode = "Процедура ВыделенныйМетод()\n" + selectedText + "\nКонецПроцедуры";
    var extractedContext = SyntaxAnalysis.AnalyseModule(extractedCode, false);
    var methodContext = extractedContext.getMethodByName("ВыделенныйМетод");
    
    for (var i=0; i<methodContext.AutomaticVars.length; i++)
    {
        this.addParam(methodContext.AutomaticVars[i]);
    }
    
    var isOK = this.form.DoModal();
}

ExtractMethodRefactoring.prototype.addParam = function (paramName, isParam, isVal) {
    var paramRow = this.Params.Add();
    paramRow.Name = paramName;
    paramRow.isParam = isParam ? true : false;
    paramRow.isVal = isVal ? true : false;
}

ExtractMethodRefactoring.prototype.BtOKClick = function (Control) {

    if (this.form.Name.match(/^[_\wА-я](?:[_\w\dА-я]*)$/))
    {
        DoMessageBox("Имя метода должно быть правильным идентификатором!");
        return;
    }

    var params = new Array;
    for (var i=0; i<this.Params.Count(); i++)
    {
        var paramRow = this.Params.Get(i);
        if (paramRow.IsParam)
            params.push((paramRow.IsVal ? 'Знач ' : '') + paramRow.Name);
    }

    var method = this.form.IsProc ? 'Процедура' : 'Функция';
    
    
    this.form.Close(true);
}

ExtractMethodRefactoring.prototype.BtCancelClick = function (Control) {
    this.form.Close(false);
}


////} ExtractMethodRefactoring

////////////////////////////////////////////////////////////////////////////////////////
////{ Вспомогательные функции
////



////} Вспомогательные функции
