$engine JScript
$uname format_script
$dname Форматирование модуля

// (с) Александр Орефков orefkov@gmail.com
// Скрипт с разными полезными для форматирования текста модуля макросами

// проверяет наличие различных сочитаний со знаком равно в строке. >= <= != итд
function isEqCombination( inputLine )
{
	var line= { text: inputLine }
	eqPos	= line.text.indexOf("=")
	if ( eqPos >= 0 )
	{
		if (line.text.charAt( eqPos - 1 ) == ">" || line.text.charAt( eqPos - 1 ) == "<" || 
			line.text.charAt( eqPos - 1 ) == "=" || line.text.charAt( eqPos - 1 ) == "!" || 
			line.text.charAt( eqPos - 1 ) == "+" || line.text.charAt( eqPos - 1 ) == "-" )
			return true
		else
			return false
	}
	else						  
		return false
}

function fillLine(symbol, count)
{	
	if ( count < 0 )
		return ""		
    var text 	= ""
    while(count--)
        text += symbol
    return text
}

function macrosTest()
{
	//проверки подготовки
    var txtWnd 	= snegopat.activeTextWindow()
	if(!txtWnd)
	{
        return
	}
    var sel 	= txtWnd.getSelection()
    var endRow 	= sel.endRow	
    if(sel.endCol == 1)
        endRow--        
    
	// цикл по строчкам в поисках максимальной позиции знака Равно
    for(var l = sel.beginRow; l <= endRow; l++)
    {
        var line = {text: txtWnd.line(l)} 
		position = getEqAdequatePosition( line.text )
    }
   
}

// минимально-необходимое размещение знака РАВНО
function getEqAdequatePosition( inputLine )
{	
    var tabSize	= profileRoot.getValue("ModuleTextEditor/TabSize");
	var line	= { text: inputLine }
	userfulIndex= firstUsefulOnTheLeft( inputLine )	
	position 	= 0	
	for( var k = 0; k <= userfulIndex; k++ )
	{
		if( line.text.charAt(k) == "\t" ) 
			position=position + tabSize
		else
			position=position+1			
	}	
	return position;
}

// Найти в левой части присвоения индекс первого символа, который не является пробелом или табом.
// индексы в строках идут с 0.
function firstUsefulOnTheLeft( inputLine )
{		
	var line	= { text: inputLine }
	eqRealPos	= line.text.indexOf("=")
	
	if ( isEqCombination( line.text ) )
		searchPos = eqRealPos - 2
	else
		searchPos = eqRealPos - 1
		
	for( var k = searchPos; k >= 0; k-- )
	{
		if( line.text.charAt( k ) != "\t" && line.text.charAt( k ) != " "  ) 
			return k;			
	}
	
	return -1;
}
 
// какой символ РАВНО используется в строке. <=, != итд
function eqSymbolInLine( inputLine )
{
	combination	= "=";
	var line	= { text: inputLine }
	eqPos		= line.text.indexOf("=")	
	if ( isEqCombination( line.text ) )		
		combination = line.text.charAt(eqPos-1) + "=";
		
	return combination;
}

/*
 * Макрос для выравнивания знаков =
 * Выстраивает знаки = в выделенном тексте в одну колонку.
 * 
 */

function macrosВыровнятьЗнакиРавно()
{	
	//проверки подготовки
    var txtWnd 	= snegopat.activeTextWindow()
    if(!txtWnd)
        return
    var sel 	= txtWnd.getSelection()
    var endRow 	= sel.endRow
    if(sel.endCol == 1)
        endRow--
    if(endRow <= sel.beginRow)
        return
    var tabSize				= profileRoot.getValue("ModuleTextEditor/TabSize");
    var replaceTabOnInput	= profileRoot.getValue("ModuleTextEditor/ReplaceTabOnInput");
    lines					= new Array() // массив информации о строках
    var maxEqualPos			= -1 // максимальная позиция знака Равно
	
	// цикл по строчкам в поисках максимальной позиции знака Равно
    for(var l = sel.beginRow; l <= endRow; l++)
    {
        var line					= {text: txtWnd.line(l)} 
        line.eqRealPos				= line.text.indexOf("=") // где в выделенной строчке знак равно?
		line.eqUsefulIndex			= firstUsefulOnTheLeft( line.text )	
		line.eqAdequatePosInSpaces	= getEqAdequatePosition( line.text )
		
		if( line.eqRealPos 	>= 0 ) 
        {			     
			line.shouldRender	= 1
			line.eqSymbolInLine	= eqSymbolInLine( line.text )
			if ( line.eqAdequatePosInSpaces > maxEqualPos )
            	maxEqualPos = line.eqAdequatePosInSpaces
        }
		else
			line.shouldRender = 0
			
        lines.push(line)
    }	
	
	var text = "" 				   // результирующий текст, который будет вставлен вместо выделенного	
	maxEqualPos = maxEqualPos + 1; // увеличить на 1, чтобы гарантировать один символ таба или пробела до знака РАВНО
    if ( !replaceTabOnInput  ){
        maxEqualPos = Math.ceil( maxEqualPos/tabSize ) * tabSize;
    }		
	
	// цикл по выделенным строкам
	// пересобрать строку пересчитав символы до знака РАВНО
    for(var l in lines)
    {
        var line		= lines[ l ]
        var symbol		= replaceTabOnInput ? ' ':'\t' 	// что вставлять. Либо пробелы либо табы					
		var symbolsNum	= (maxEqualPos - line.eqAdequatePosInSpaces) // количество символов(таб или пробел), которые именно для этой строки нужно добавить до дальнего знака равно.
		
        if (!replaceTabOnInput)
            symbolsNum = Math.ceil( symbolsNum/tabSize )
			
	
		if ( line.shouldRender )
		{				
			copyAmmount			= line.eqUsefulIndex + 1
			strBeforeEq			= line.text.substr( 0, copyAmmount )				
			strAfterEq			= line.text.substr( line.eqRealPos + 1 )
			additionalSymbols	= fillLine(symbol, symbolsNum)
	        newLine				= strBeforeEq  + additionalSymbols + line.eqSymbolInLine + strAfterEq + "\n"
		}
		else
			newLine = line.text + "\n"
			
        text += newLine
    }
	
    txtWnd.setSelection(sel.beginRow, 1, endRow + 1, 1)
    txtWnd.selectedText = text
    txtWnd.setCaretPos(sel.beginRow+lines.length-1, newLine.length);
	
}

/*
 * Макрос для сдвига текста за символом | (для форматирования запросов)
 * Сдвигает текст вправо/влево вставляя/удаляя при этом заданный символ
 */
function MoveBlock(toLeft, spaceChar)
{    
    var txtWnd = snegopat.activeTextWindow()
    if(!txtWnd || txtWnd.isReadOnly)
        return
    var sel		= txtWnd.getSelection()
    var endRow	= sel.endRow
 //   if(sel.endCol == 1)
        endRow--
    if(endRow < sel.beginRow)
        return
    var text = ""
    for(var l = sel.beginRow; l <= endRow; l++)
    {
        var str			= txtWnd.line(l)
        var vlRealPos	= str.indexOf("|")
        if(vlRealPos >= 0)
        {
            if (toLeft) //to left
                str = str.replace("|" + spaceChar, "|")
            else //to right
                str = str.replace("|", "|" + spaceChar)
        }
        text += str + "\n"
    }
    txtWnd.setSelection(sel.beginRow, 1, endRow + 1, 1)
    txtWnd.selectedText = text
    txtWnd.setSelection(sel.beginRow, 1, endRow + 1, 1)
}
function macrosСдвинутьБлокВлевоНаПробел() //hotkey: ctrl+;
{
    MoveBlock(true, " ")
}
function macrosСдвинутьБлокВправоНаПробел() //hotkey: ctrl+'
{
    MoveBlock(false, " ")
}
function macrosСдвинутьБлокВлевоНаТаб() //hotkey: ctrl+shift+;
{
    MoveBlock(true, "\t")
}
function macrosСдвинутьБлокВправоНаТаб() //hotkey: ctrl+shift+'
{
    MoveBlock(false, "\t")
}

// Макрос удаляет white-space символы в конце строк, а также заменяет все \r\n на \n
function macrosУдалитьКонцевыеПробелы()
{
    var txtWnd = snegopat.activeTextWindow()
    if(!txtWnd || txtWnd.isReadOnly)
        return
    var replaces = 0, symbols = 0, crnl = 0
    var text = txtWnd.text.replace(/[ \t]+\r*\n/g, function(str)
        {
            replaces++
            symbols += str.length - 1
            if(str.length > 2 && str.charAt(str.length - 2) == '\r')
                crnl++, symbols--
            return '\n'
        }
    )
    if(replaces)
    {
        Message("Исправлено cтрок: " + replaces + "\nУбрано символов: " + symbols + "\nУбрано CR: " + crnl)
        var caretPos = txtWnd.getCaretPos()
        txtWnd.setSelection(1, 1, txtWnd.linesCount + 1, 1)
        txtWnd.selectedText = text;
        txtWnd.setCaretPos(caretPos.beginRow, caretPos.beginCol)
    }
    else
        Message("Все чисто")
}

/*
 * Макрос для выравнивания текста по первой запятой
 * Выстраивает знаки = в выделенном тексте в одну колонку.
 */
function macrosВыровнятьПоПервойЗапятой()
{
    var txtWnd = snegopat.activeTextWindow()
    if(!txtWnd)
        return
    var sel = txtWnd.getSelection()
    var endRow = sel.endRow
    if(sel.endCol == 1)
        endRow--
    if(endRow <= sel.beginRow)
        return
    var tabSize = profileRoot.getValue("ModuleTextEditor/TabSize")
    var replaceTabOnInput = profileRoot.getValue("ModuleTextEditor/ReplaceTabOnInput");
    lines = new Array()
    var maxEqualPos = -1
    for(var l = sel.beginRow; l <= endRow; l++)
    {
        var line = {text: txtWnd.line(l)}
        line.eqRealPos = line.text.indexOf(",")
        if(line.eqRealPos >= 0)
        {
            line.eqPosInSpaces = 0
            for(var k = 0; k < line.eqRealPos; k++)
            {
                if(line.text.charAt(k) == "\t")
                    line.eqPosInSpaces += tabSize - (line.eqPosInSpaces % tabSize)
                else
                    line.eqPosInSpaces++
            }
            if(line.eqPosInSpaces > maxEqualPos)
                maxEqualPos = line.eqPosInSpaces
        }
        lines.push(line)
    }
    var text = ""
    if (!replaceTabOnInput){
        maxEqualPos = Math.ceil(maxEqualPos/tabSize)*tabSize;
    }
    for(var l in lines)
    {

        var line = lines[l]

        var symbol	= replaceTabOnInput ? ' ':'\t';
        var count	= (maxEqualPos - line.eqPosInSpaces);
        if (!replaceTabOnInput){
            count = Math.ceil(count/tabSize);
        }

        //count = (count==0) ? 1 : count;

        var t1 = line.text.substr(0, line.eqRealPos + 1)
        var t2 = line.text.substr(line.eqRealPos + 1).replace(/^\s+/, "")
        newLine = t1 + fillLine(" ", maxEqualPos - line.eqPosInSpaces + 1) + t2 + "\n"
        text += newLine;

    }
    txtWnd.setSelection(sel.beginRow, 1, endRow + 1, 1)
    txtWnd.selectedText = text
    txtWnd.setCaretPos(sel.beginRow+lines.length-1, newLine.length);
}

function getPredefinedHotkeys(predef)
{
    predef.setVersion(0)
    predef.add("ВыровнятьЗнакиРавно", "Ctrl + =")
    predef.add("СдвинутьБлокВлевоНаПробел", "Ctrl + ;")
    predef.add("СдвинутьБлокВправоНаПробел", "Ctrl + '")
    predef.add("СдвинутьБлокВлевоНаТаб", "Ctrl + Shift + ;")
    predef.add("СдвинутьБлокВправоНаТаб", "Ctrl + Shift + '")
}
