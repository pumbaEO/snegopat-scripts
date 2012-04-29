$engine JScript
$uname testSyntaxSpell
$dname Тесты для класса SyntaxSpell
$addin global
$addin stdcommands
$addin stdlib

stdlib.require('jsUnitCore.js', SelfScript);
stdlib.require('SyntaxSpell.js', SelfScript);
    
//{ setUp/tearDown    
function setUp() {
}

function tearDown() {
}
//} setUp/tearDown

//{ tests of AnalyseModule

function macrosTestAnalyseText1() {

    var moduleText = ""
        + "Перем ПеременнаяМодуля;\n\n"
        + "Перем ЕщеОднаПеременная;\n"
        + "Результат = МояФункция();\n"
    //debugger;
    //var cnt = SyntaxSpell.SpellCheckerText(moduleText);
	var cnt = GetSpellChecker()
    var results = cnt.CheckWords({"ПеременнаяМодуля":false});
    
    assertEquals('Неправильная проверка орфографии!', false, results["ПеременнаяМодуля"]);
    
}

/* function macrosTestAnalyseModule2_ТолькоПеременные() {

    var moduleText = ""
        + "Перем мПеременнаяМодуля;\n\n"
        + "Перем ЕщеОднаПеременная;\n"
        + "Перем ЭкспортнаяПеременная Экспорт;\n"
        + "Перем ЭкспортныйМассив[10] Экспорт, ЛокальныйМассив[3], ПростоПеременная;\n"

    var cnt = SyntaxAnalysis.AnalyseModule(moduleText);
            
    assertEquals('Неправильно определено количество методов!', 0, cnt.Methods.length);
    
    assertEquals('Неправильно определено количество переменных модуля!', 6, cnt.ModuleVars.length);
    assertArrayEqualsIgnoringOrder('Неправильно определен список переменных модуля!',
        ['мПеременнаяМодуля', 'ЕщеОднаПеременная', 'ЭкспортнаяПеременная', 
        'ЭкспортныйМассив', 'ЛокальныйМассив', 'ПростоПеременная'], cnt.ModuleVars);
}

function macrosTestAnalyseModule3_ПеременныеМодуляВОднуСтроку() {

    var moduleText = ""
        + "Перем мПеременнаяМодуля, ЕщеОднаПеременная, ЭкспортнаяПеременная Экспорт,"
        + "ЭкспортныйМассив[10] Экспорт, ЛокальныйМассив[3], ПростоПеременная";
//debugger;
    var cnt = SyntaxAnalysis.AnalyseModule(moduleText);
            
    assertEquals('Неправильно определено количество методов!', 0, cnt.Methods.length);
    
    assertEquals('Неправильно определено количество переменных модуля!', 6, cnt.ModuleVars.length);
    assertArrayEqualsIgnoringOrder('Неправильно определен список переменных модуля!',
        ['мПеременнаяМодуля', 'ЕщеОднаПеременная', 'ЭкспортнаяПеременная', 
        'ЭкспортныйМассив', 'ЛокальныйМассив', 'ПростоПеременная'], cnt.ModuleVars);
}

function macrosTestAnalyseModule4_ПеременныеМодуляНаНесколькихСтроках() {

    // Тест сломан.

    var moduleText = ""
        + "Перем мПеременнаяМодуля, ЕщеОднаПеременная, ЭкспортнаяПеременная Экспорт,\n"
        + "ЭкспортныйМассив[10] Экспорт, ЛокальныйМассив[3], ПростоПеременная;";
//debugger;
    var cnt = SyntaxAnalysis.AnalyseModule(moduleText);
            
    //Message(cnt.ModuleVars.join(', '));
            
    assertEquals('Неправильно определено количество методов!', 0, cnt.Methods.length);
    
    assertEquals('Неправильно определено количество переменных модуля!', 6, cnt.ModuleVars.length);
    assertArrayEqualsIgnoringOrder('Неправильно определен список переменных модуля!',
        ['мПеременнаяМодуля', 'ЕщеОднаПеременная', 'ЭкспортнаяПеременная', 
        'ЭкспортныйМассив', 'ЛокальныйМассив', 'ПростоПеременная'], cnt.ModuleVars);
}

function macrosTestAnalyseModule5_МодульБезПеременных() {

    var moduleText = ""
        + "Процедура МояПроцедура(Парам1, Парам2)\n"
        + "	Перем МояПерем1;\n\n"	
        + "	МояПерем1 = 42;\n\n"
        + "	АвтоматическаяПеременная = 10;\n"	
        + "	мПеременнаяМодуля = \"\";\n"	
        + "КонецПроцедуры\n\n"
        + "Функция МояФункция(ПараметрФункции)\n"
        + "	Сообщить(мПеременнаяМодуля);	\n"
        + "	Возврат Истина;	\n"
        + "КонецФункции\n\n"
        + "МояПроцедура(1, 2);\n"
        + "Результат = МояФункция();\n"

    var cnt = SyntaxAnalysis.AnalyseModule(moduleText);
    //Message(cnt.ModuleVars.join(','));
//debugger;        
    assertEquals('Неправильно определено количество методов!', 2, cnt.Methods.length);    
    assertEquals('Неправильно определено количество переменных модуля!', 0, cnt.ModuleVars.length);
}

function macrosTestAnalyseModule6_МетодыВОднуСтроку() {

    var moduleText = ""
        + "Процедура МояПроцедура(Парам1, Парам2) "
        + "	Перем МояПерем1; "	
        + "	МояПерем1 = 42; "
        + "	АвтоматическаяПеременная = 10; "	
        + "	мПеременнаяМодуля = \"\"; "	
        + "КонецПроцедуры "
        + "Функция МояФункция(ПараметрФункции) "
        + "	Сообщить(мПеременнаяМодуля); "
        + "	Возврат Истина; "
        + "КонецФункции "
        + "МояПроцедура(1, 2); "
        + "Результат = МояФункция(); "

    var cnt = SyntaxAnalysis.AnalyseModule(moduleText);

    assertEquals('Неправильно определено количество методов!', 2, cnt.Methods.length);    
    assertEquals('Неправильно определено количество переменных модуля!', 0, cnt.ModuleVars.length);
}

function macrosTestAnalyseModule7_МодульВОднуСтроку() {

    var moduleText = ""
        + "Перем мПеременнаяМодуля; "
        + "Перем ЕщеОднаПеременная; "
        + "Перем ЭкспортнаяПеременная Экспорт; "
        + "Перем ЭкспортныйМассив[10] Экспорт, ЛокальныйМассив[3], ПростоПеременная; "
        + "Процедура МояПроцедура(Парам1, Парам2) "
        + "	Перем МояПерем1; "	
        + "	МояПерем1 = 42; "
        + "	АвтоматическаяПеременная = 10; "	
        + "	мПеременнаяМодуля = \"\"; "	
        + "КонецПроцедуры "
        + "Функция МояФункция(ПараметрФункции) "
        + "	Сообщить(мПеременнаяМодуля); "
        + "	Возврат Истина;	 "
        + "КонецФункции "
        + "МояПроцедура(1, 2); "
        + "Результат = МояФункция();"

//debugger;        
    var cnt = SyntaxAnalysis.AnalyseModule(moduleText);
    //Message(cnt.ModuleVars.join(','));
        
    assertEquals('Неправильно определено количество методов!', 2, cnt.Methods.length);
    
    assertEquals('Неправильно определено количество переменных модуля!', 6, cnt.ModuleVars.length);
    assertArrayEqualsIgnoringOrder('Неправильно определен список переменных модуля!',
        ['мПеременнаяМодуля', 'ЕщеОднаПеременная', 'ЭкспортнаяПеременная', 
        'ЭкспортныйМассив', 'ЛокальныйМассив', 'ПростоПеременная'], cnt.ModuleVars);
}

function macrosTestAnalyseModule8_ОпределениеЛокальныхПеременных() {

    var moduleText = ""
        + "Перем мПеременнаяМодуля;\n\n"
        + "Перем ЕщеОднаПеременная;\n"
        + "Перем ЭкспортнаяПеременная Экспорт;\n"
        + "Перем ЭкспортныйМассив[10] Экспорт, ЛокальныйМассив[3], ПростоПеременная;\n"
        + "Процедура МояПроцедура(Парам1, Парам2)\n"
        + "	Перем МояПерем1;\n\n"	
        + "	МояПерем1 = 42;\n\n"
        + "	АвтоматическаяПеременная = 10;\n"	
        + "	мПеременнаяМодуля = \"\";\n"	
        + "КонецПроцедуры\n\n"
        + "Функция МояФункция(ПараметрФункции)\n"
        + "	Сообщить(мПеременнаяМодуля);	\n"
        + "	Возврат Истина;	\n"
        + "КонецФункции\n\n"
        + "МояПроцедура(1, 2);\n"
        + "Результат = МояФункция();\n"

    var cnt = SyntaxAnalysis.AnalyseModule(moduleText);
    //Message(cnt.ModuleVars.join(','));
            
    assertEquals('Неправильно определено количество переменных модуля!', 6, cnt.ModuleVars.length);
    assertArrayEqualsIgnoringOrder('Неправильно определен список переменных модуля!',
        ['мПеременнаяМодуля', 'ЕщеОднаПеременная', 'ЭкспортнаяПеременная', 
        'ЭкспортныйМассив', 'ЛокальныйМассив', 'ПростоПеременная'], cnt.ModuleVars);

    assertEquals('Неправильно определено количество методов!', 2, cnt.Methods.length);
            
    var func = cnt.getMethodByName('МояФункция');
    assertNotUndefined("Метод МояФункция не найден", func);    
    assertArrayEqualsIgnoringOrder(['ПараметрФункции'], func.Params);

    assertEquals(0, func.DeclaredVars.length);    
    assertEquals(0, func.AutomaticVars.length);    
    
    var proc = cnt.getMethodByName('МояПроцедура');
    assertNotNull("Метод МояПроцедура не найден", proc);    
    assertArrayEqualsIgnoringOrder(['Парам1', 'Парам2'], proc.Params);

    // Локальные переменные процедуры.
    assertArrayEqualsIgnoringOrder(['МояПерем1'], proc.DeclaredVars);    
    assertArrayEqualsIgnoringOrder(['АвтоматическаяПеременная'], proc.AutomaticVars);    
    
}

function macrosTestAnalyseModule9_ОпределениеМетодаНаРазныхСтроках() {
    var moduleText = ""
        + "Процедура \n"
        + "    Проверки ( Перем1,Перем2, Перем3)\n"
        + "КонецПроцедуры"

    var cnt = SyntaxAnalysis.AnalyseModule(moduleText);

    assertEquals('Неправильно определено количество методов!', 1, cnt.Methods.length);    
    assertEquals('Неправильно определено количество переменных модуля!', 0, cnt.ModuleVars.length);
}

function macrosTestAnalyseModule10_ОпределениеПараметровМетодаНаРазныхСтроках() {
    var moduleText = ""
        + "Процедура Проверки ( Перем1, \n"
        + "    Перем2, Перем3)\n"
        + "КонецПроцедуры"
    //debugger
    var cnt = SyntaxAnalysis.AnalyseModule(moduleText);

    assertEquals('Неправильно определено количество методов!', 1, cnt.Methods.length);    
    assertEquals('Неправильно определено количество переменных модуля!', 0, cnt.ModuleVars.length);
    var proc = cnt.getMethodByName('Проверки');
    assertNotNull("Метод Проверки не найден", proc);    
    assertArrayEqualsIgnoringOrder(['Перем1', 'Перем2', 'Перем3'], proc.Params);
}

function macrosTestAnalyseModule11_ОпределениеПеременныхМетодаПоУмолчанию() {
    var moduleText = ""
        + "Процедура Проверки (Знач Парам1, Парам2 = Ложь)\n"
        + "КонецПроцедуры"
    //debugger
    var cnt = SyntaxAnalysis.AnalyseModule(moduleText);

    assertEquals('Неправильно определено количество методов!', 1, cnt.Methods.length);    
    assertEquals('Неправильно определено количество переменных модуля!', 0, cnt.ModuleVars.length);
    var proc = cnt.getMethodByName('Проверки');
    assertNotNull("Метод Проверки не найден", proc);    
    assertArrayEqualsIgnoringOrder(['Парам1', 'Парам2'], proc.Params);
    
}

function macrosTestAnalyseModule12_ОпределениеКонеткстаКомпиляции() {
    var moduleText = ""
        + "&НаКлиенте\n"
        + "Процедура Проверки (Знач Парам1, Парам2 = Ложь)\n"
        + "КонецПроцедуры"
    var cnt = SyntaxAnalysis.AnalyseModule(moduleText);

    assertEquals('Неправильно определено количество методов!', 1, cnt.Methods.length);    
    assertEquals('Неправильно определено количество переменных модуля!', 0, cnt.ModuleVars.length);
    var proc = cnt.getMethodByName('Проверки');
    assertNotNull("Метод Проверки не найден", proc);    
    assertEquals("Конетекст компиляции не обнаружен", "НаКлиенте", proc.Context)
    assertArrayEqualsIgnoringOrder(['Парам1', 'Парам2'], proc.Params);
    
}
function macrosTestAnalyseModule13_ОпределениеПараметровМетодаНаРазныхСтрокахСКомментариями() {
    var moduleText = ""
        + "Процедура Проверки ( Перем1, //Текстовый комментарий перемменной, да и такое может быть.  \n"
        + "    Перем2, Перем3)\n"
        + "КонецПроцедуры"
    debugger
    var cnt = SyntaxAnalysis.AnalyseModule(moduleText);

    assertEquals('Неправильно определено количество методов!', 1, cnt.Methods.length);    
    assertEquals('Неправильно определено количество переменных модуля!', 0, cnt.ModuleVars.length);
    var proc = cnt.getMethodByName('Проверки');
    assertNotNull("Метод Проверки не найден", proc);    
    assertArrayEqualsIgnoringOrder(['Перем1', 'Перем2', 'Перем3'], proc.Params);
}

function macrosTestAnalyseModule14_ОпределениеПараметровМетодаНаРазныхСтрокахСКомментариямиИСкобками() {
    var moduleText = ""
        + "Процедура Проверки ( Перем1, //Текстовый комментарий перемменной, да и такое может быть.  \n"
        + "    Перем2, // Любой текст и ссылка на процедуру или функцию МояПроцедура()\n"
        + "    Перем3)\n"
        + "КонецПроцедуры"
    
    var cnt = SyntaxAnalysis.AnalyseModule(moduleText);

    assertEquals('Неправильно определено количество методов!', 1, cnt.Methods.length);    
    assertEquals('Неправильно определено количество переменных модуля!', 0, cnt.ModuleVars.length);
    var proc = cnt.getMethodByName('Проверки');
    assertNotNull("Метод Проверки не найден", proc);    
    assertArrayEqualsIgnoringOrder(['Перем1', 'Перем2', 'Перем3'], proc.Params);
}
 */


//} tests of AnalyseModule

