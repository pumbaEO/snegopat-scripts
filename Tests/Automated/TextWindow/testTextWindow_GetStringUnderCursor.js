$engine JScript
$uname testTextWindow_GetStringUnderCursor
$dname Тесты для метода TextWindow::GetStringUnderCursor
$addin global
$addin stdcommands
$addin stdlib

stdlib.require('jsUnitCore.js', SelfScript);

var TWW = stdlib.require('TextWindow.js');

/*** Текст для тестирования.
МояСтрока = "Однострочный текст";
А = 1 + 2;
МояМультистрока = "Первая строка
	|Вторая строка
	|Третья строка";
СтрокаСКавычками = "Это ""строковый"" литерал";
ПустаяСтрока = "";
ТекстЗапроса = "ВЫБРАТЬ 
 |ПОДСТРОКА(""Строчка"", 1, 1) КАК Символ;
 |";
С1="Строка слева"; С2="Строка справа"
*/
var text = 
"МояСтрока = \"Однострочный текст\";\n"
+ "А = 1 + 2;\n"
+ "МояМультистрока = \"Первая строка\n"
+ "	|Вторая строка\n"
+ "	|Третья строка\";\n"
+ "СтрокаСКавычками = \"Это \"\"строковый\"\" литерал\";\n"
+ "ПустаяСтрока = \"\";\n"
+ "ТекстЗапроса = \"ВЫБРАТЬ \n"
+ " |ПОДСТРОКА(\"\"Строчка\"\", 1, 1) КАК Символ;\n"
+ " |\";\n"
+ "С1=\"Строка слева\"; С2=\"Строка справа\"\n";

var textDoc = null;
var twnd = null;
    
function setUp() {
    textDoc = v8New("TextDocument");
    textDoc.SetText(text);

    textDoc.Show();
    
    twnd = TWW.GetTextWindow();
}

function tearDown() {
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

function macrosTest1() {
    twnd.SetCaretPos(1, 17);
    assertEquals('Однострочный текст', twnd.GetStringUnderCursor());
}

function macrosTest2() {
    twnd.SetCaretPos(3, 26);
    assertEquals("Первая строка\nВторая строка\nТретья строка", twnd.GetStringUnderCursor());
}

function macrosTest3() {
    twnd.SetCaretPos(4, 13);
    assertEquals("Первая строка\nВторая строка\nТретья строка", twnd.GetStringUnderCursor());
}

function macrosTest4() {
    twnd.SetCaretPos(5, 3);
    assertEquals("Первая строка\nВторая строка\nТретья строка", twnd.GetStringUnderCursor());
}

function macrosTest5() {
    twnd.SetCaretPos(6, 21);
    assertEquals("Это \"строковый\" литерал", twnd.GetStringUnderCursor());
}

function macrosTest6() {
    twnd.SetCaretPos(6, 30);
    assertEquals("Это \"строковый\" литерал", twnd.GetStringUnderCursor());
}

function macrosTest7() {
    twnd.SetCaretPos(7, 17);
    assertEquals(null, twnd.GetStringUnderCursor());
}

function macrosTest8() {
    twnd.SetCaretPos(8, 19);
    assertEquals("ВЫБРАТЬ \nПОДСТРОКА(\"Строчка\", 1, 1) КАК Символ;\n", twnd.GetStringUnderCursor());
}

function macrosTest9() {
    twnd.SetCaretPos(10, 2);
    assertEquals("ВЫБРАТЬ \nПОДСТРОКА(\"Строчка\", 1, 1) КАК Символ;\n", twnd.GetStringUnderCursor());
}

function macrosTest10() {
    twnd.SetCaretPos(11, 10);
    assertEquals("Тест 10.1 провалился", "Строка слева", twnd.GetStringUnderCursor());
    twnd.SetCaretPos(11, 34);
    assertEquals("Тест 10.2 провалился", "Строка справа", twnd.GetStringUnderCursor());
    twnd.SetCaretPos(11, 19);
    assertEquals("Тест 10.3 сломан: не отрабатывает ситуация, когда курсор находится между двух строковых литералов.", null, twnd.GetStringUnderCursor());
}