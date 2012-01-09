$engine JScript
$uname testSyntaxAnalysis_AnalyseTextDoc
$dname Тесты для класса SyntaxAnalysis (AnalyseTextDocument)
$addin global
$addin stdcommands
$addin stdlib

stdlib.require('jsUnitCore.js', SelfScript);
stdlib.require('SyntaxAnalysis.js', SelfScript);

var TWW = stdlib.require('TextWindow.js');

var moduleText = ""
    + "Перем мПеременнаяМодуля;\n"
    + "\n"
    + "Перем ЕщеОднаПеременная;\n"
    + "Перем ЭкспортнаяПеременная Экспорт;\n"
    + "Перем ЭкспортныйМассив[10] Экспорт, ЛокальныйМассив[3], ПростоПеременная;\n"
    + "Процедура МояПроцедура(Парам1, Парам2)\n"
    + "	Перем МояПерем1;\n"
    + "\n"	
    + "	МояПерем1 = 42;\n"
    + "\n"
    + "	АвтоматическаяПеременная = 10;\n"	
    + "	мПеременнаяМодуля = \"\";\n"	
    + "КонецПроцедуры\n"
    + "\n"
    + "Функция МояФункция(ПараметрФункции)\n"
    + "	Сообщить(мПеременнаяМодуля);	\n"
    + "	Возврат Истина;	\n"
    + "КонецФункции\n"
    + "\n"
    + "МояПроцедура(1, 2);\n"
    + "Результат = МояФункция();\n"

var textDoc = null;
var twnd = null;
    
function setUp()
{
    textDoc = v8New("TextDocument");
    textDoc.SetText(moduleText);

    textDoc.Show();
    
    twnd = TWW.GetTextWindow();
}

function tearDown()
{
    if (twnd)
        delete twnd;
    
    // Чтобы при закрытии не выдавалось сообщение "Записать?", сохраним документ во временный файл.
    var tempFile = globalContext("{4A993AB7-2F75-43CF-B34A-0AD9FFAEE7E3}").GetTempFileName();
    textDoc.Write(tempFile);
    
    // Закроем окно текстового документа.
    stdcommands.Frame.FileClose.send();    
    
    // Удалим временный файл.
    var f = v8New("File", tempFile);
    globalContext("{22A21030-E1D6-46A0-9465-F0A5427BE011}").DeleteFiles(f.Path, f.Name);
}


//{ tests of AnalyseTextDocument
function macrosTestAnalyseTextDocument_GetMethodSource1() {

    var module = SyntaxAnalysis.AnalyseTextDocument(twnd);
    
    var src = ""  
    + "Процедура МояПроцедура(Парам1, Парам2)\n"
    + "	Перем МояПерем1;\n\n"	
    + "	МояПерем1 = 42;\n\n"
    + "	АвтоматическаяПеременная = 10;\n"	
    + "	мПеременнаяМодуля = \"\";\n"	
    + "КонецПроцедуры";
 //debugger;   
    assertEquals(src, module.getMethodSource("МояПроцедура"));
            
}

function macrosTestAnalyseTextDocument_GetMethodSource2() {

    var module = SyntaxAnalysis.AnalyseTextDocument(twnd);
       
    assertUndefined(module.getMethodSource("НесуществующийМетод"));
            
}

function macrosTestAnalyseTextDocument_getMethodByLineNumber1_СтрокаВнутриПроцедуры() {

    var module = SyntaxAnalysis.AnalyseTextDocument(twnd);
    var method = module.getMethodByLineNumber(6);
    assertNotUndefined(method);    
    assertEquals('МояПроцедура', method.Name);
}

function macrosTestAnalyseTextDocument_getMethodByLineNumber2_ПоПервойСтроке() {

    var module = SyntaxAnalysis.AnalyseTextDocument(twnd);
//debugger;
    var method = module.getMethodByLineNumber(6);
    assertNotUndefined(method);
    assertEquals('МояПроцедура', method.Name);
}

function macrosTestAnalyseTextDocument_getMethodByLineNumber3_ПоПоследнейСтроке() {

    var module = SyntaxAnalysis.AnalyseTextDocument(twnd);
//debugger;    
    var method = module.getMethodByLineNumber(13);
    assertNotUndefined(method);    
    assertEquals('МояПроцедура', method.Name);
}

function macrosTestAnalyseTextDocument_getMethodByLineNumber4_ВнеПроцедуры_Выше() {

    var module = SyntaxAnalysis.AnalyseTextDocument(twnd);    
    var method = module.getMethodByLineNumber(2);
    assertUndefined(method);
}

function macrosTestAnalyseTextDocument_getMethodByLineNumber4_ВнеПроцедуры_Ниже() {

    var module = SyntaxAnalysis.AnalyseTextDocument(twnd);
    var method = module.getMethodByLineNumber(21);
    assertUndefined(method);
}

//} tests of AnalyseTextDocument