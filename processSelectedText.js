$engine JScript
$uname ProcessSelectedText
$dname Обработка выделенного текста
$addin global
$addin stdlib

////////////////////////////////////////////////////////////////////////////////////////
////{ Cкрипт "Обработка выделеного текста" (processSelectedText.js) для проекта "Снегопат"
////
//// Автор: Александр Кунташов <kuntashov@gmail.com>, http://compaud.ru/blog
////}
////////////////////////////////////////////////////////////////////////////////////////

function macrosОбработатьВыделенныйТекст() {
    var textWindow = stdlib.require('TextWindow.js').GetTextWindow();
    if (!textWindow)
        return;
        
    var textProcessor = new SelTextProcessor(textWindow);
    textProcessor.open();
}

function SelTextProcessor(textWindow) {
    this.form = loadScriptForm(SelfScript.fullPath.replace(/js$/, 'ssf'), this);
    this.jsCode = this.form.Controls.JavaScriptCode;
    this.result = this.form.Controls.Result;
    
    this.textWindow = textWindow;
    this.inputText = this.textWindow.GetSelectedText();
}

SelTextProcessor.prototype.open = function () {
    this.jsCode.Clear();
    this.result.Clear();
    this.form.DoModal();
}

SelTextProcessor.prototype.processText = function () {
    var inputText = this.inputText;
    var result = eval(this.jsCode.GetText());
    this.result.SetText(result);
}

SelTextProcessor.prototype.pasteResult = function () {
    this.textWindow.SetSelectedText(this.result.GetText());
}

SelTextProcessor.prototype.CancelClick = function (Control) {
    this.form.Close();
}

SelTextProcessor.prototype.OKClick = function (Control) {
    this.pasteResult();
    this.Close();
}

SelTextProcessor.prototype.CmdBarRun = function (Control) {
    this.processText();
}


