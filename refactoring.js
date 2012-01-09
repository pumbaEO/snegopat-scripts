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

SelfScript.self['macrosВыделить метода (extract method)'] = function () {

    var tw = GetTextWindow();
    if (!tw) return;

    var selText = tw.GetSelectedText();
    if (selText == '') return;
        
    var tpl = 'Процедура <?"Имя процедуры">(<?"Параметры процедуры")\n\n\t<?>\n\nКонецПроцедуры//<?"Имя процедуры">()';
        
}

SelfScript.self['macrosПоказать список процедур и функций модуля'] = function () {
    var tw = GetTextWindow();
    if (!tw) return;
    var module = SyntaxAnalysis.AnalyseTextDocument(tw);
    var methList = new MethodListForm(module);
    methList.selectMethod();
}

////} Макросы

////////////////////////////////////////////////////////////////////////////////////////
////{ MethodListForm
////

function MethodListForm(module) {
    this.module = module;
    this.form = loadScriptForm(SelfScript.fullPath.replace(/\.js$/, '.methodList.ssf'), this);
    this.form.Controls.MethodList.Value = this.module.getMethodsTable();
}

MethodListForm.prototype.selectMethod = function () {
    return this.form.DoModal();
}

MethodListForm.prototype.MethodListSelection = function (Control, SelectedRow, Column, DefaultHandler) {
    //TODO: обработка выбора строки.
    this.form.Close();
}

MethodListForm.prototype.MethodListOnRowOutput = function (Control, RowAppearance, RowData) {
    // Вставить содержимое обработчика.
}


////} MethodListForm


////////////////////////////////////////////////////////////////////////////////////////
////{ Вспомогательные функции
////



////} Вспомогательные функции
