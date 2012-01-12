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
    refactor(ExtractMethodForm, 'extractMethod');
}

SelfScript.self['macrosПоказать список процедур и функций модуля'] = function () {
    var tw = GetTextWindow();
    if (!tw) return;
    var module = SyntaxAnalysis.AnalyseTextDocument(tw);
    var methList = new MethodListForm(module);
    if (methList.selectMethod())
        Message(methList.SelectedMethod.Name);
}

////} Макросы

function refactor(refactorerClass, methodName) {
    var tw = GetTextWindow();
    if (!tw) return;
    var module = SyntaxAnalysis.AnalyseTextDocument(tw);
    var refactorer = new refactorerClass(module);
    refactorer[methodName].call(refactorer);
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
////{ ExtractMethodForm
////

function ExtractMethodForm(module) {
    this.module = module;
    this.form = loadScriptForm(SelfScript.fullPath.replace(/\.js$/, '.extractMethod.ssf'), this);    
}

ExtractMethodForm.prototype.extractMethod = function () {
    var isOK = this.form.DoModal();
}

ExtractMethodForm.prototype.BtOKClick = function (Control) {
    this.form.Close(true);
}

ExtractMethodForm.prototype.BtCancelClick = function (Control) {
    this.form.Close(false);
}

////} ExtractMethodForm

////////////////////////////////////////////////////////////////////////////////////////
////{ Вспомогательные функции
////



////} Вспомогательные функции
