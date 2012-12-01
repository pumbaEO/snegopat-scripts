$engine JScript
$uname predef
$dname Пример получения списка предопределенных счетов
$addin stdlib

stdlib.require('SelectValueDialog.js', SelfScript);

var predefinedValues = null;

function macrosВыбратьПредопределенныйСчет() {
	
	events.connect(windows, "onDoModal", SelfScript.Self);
	// Собственно, этого шаблона должно быть достаточно :)
	// ...но мы загорелись целью все-таки получить весь список предопределенных 
	// в какую-нибудь переменную.
	snegopat.parseTemplateString('<?"", ПланСчетовПредопределенныеДанные>');
	events.disconnect(windows, "onDoModal", SelfScript.Self);
	
	if (predefinedValues) {
		// Тут у нас ассоциативный массив с предопределенными.
		// Можем из активного текстового документа взять из под курсора номер счета
		// и получить по нему из массива имя. 
		// Мы пока просто предложим выбрать из диалога.
		var dlg = new SelectValueDialog('Выберите предопределенный счет', predefinedValues);
		if (dlg.selectValue()) {
			// Здесь счет можно вставить в модуль.
			Message('Выбран: ' + dlg.selectedValue);
		}
	}
}

function onDoModal(dlgInfo) {

	if (dlgInfo.stage == openModalWnd && dlgInfo.Caption.match(/Предопределенные счета/)) {
		
		predefinedValues = getPredefined(dlgInfo.form);
		
        dlgInfo.result = 0; // Нажимаем "Отмена".
        dlgInfo.cancel = true; // Окно показывать не надо.
        
	} else if (dlgInfo.stage == openModalWnd && dlgInfo.Caption.match(/Выбор объекта: План счетов/)) {
	
		// Здесь надо выбрать план счетов.
		// Пока исходим из ситуации, что план счетов у нас один -  
		// выбираем первый план счетов из списка.
		var wsh = new ActiveXObject("WScript.Shell");
        setTimeout(function () { wsh.SendKeys("{ENTER}");}, 100);
        //dlgInfo.result = 1; // Нажимаем "Ок".
        //dlgInfo.cancel = true; // Окно показывать не надо.

	}
	
}

// Возвращает ассоциативный массив:
// Ключ - строка вида "10.1 - СырьеМатериалы" (номер счета - имя предопределенного счета)
// Значение - имя предопределенного счета.
function getPredefined(form)
{
	var predefined = {};
	(function (parentRow) {
	    for(var row = parentRow.firstChild; row; row = row.next)
	    {
	    	var accName = row.getCellValue(1);
	    	var accNumber = row.getCellValue(2);
			if (accName != '' && accNumber != '') {
				predefined[accNumber + ' - ' + accName] = row.getCellValue(1);
			}
			if (row.firstChild) {
				// Рекурсивно обходим ветку в глубину.
				arguments.callee(row);
			}
	    }
	})(form.getControl(0).dataSource.root);
	
	return predefined;
}

function setTimeout(func, delay) {

    function DelayedFunc(func) {
        this.timerId = 0;
        this.func = func;
        this.callDelayed = function () {
            killTimer(this.timerId);
            this.func.call(null);
        }
    }

    var df = new DelayedFunc(func);
    df.timerId = createTimer(delay, df, 'callDelayed');
    
}