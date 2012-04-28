$engine JScript
$uname guidGen
$dname Генератор уникальных идентификаторов
$addin global

/* ======================================================================

AUTHOR: Василий Фролов aka Палыч, palytsh@mail.ru
DATE  : 02.02.2012

COMMENT: В окне программного модуля заменяет выделенный текст новым ГУИДом.

========================================================================= */

function getPredefinedHotkeys(predef){
	predef.setVersion(1);
	predef.add("ВставитьНовыйУникальныйИдентификатор", 
		"Ctrl + Alt + Shift + G");
}

function macrosВставитьНовыйУникальныйИдентификатор(){
	var w = snegopat.activeTextWindow();
	if (!w) return false;
	
	var sel = w.getSelection();
	w.selectedText = newGuid();
}

function newGuid(){
	var q = v8New("УникальныйИдентификатор");
	return toV8Value(q).presentation();
}
