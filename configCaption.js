$engine JScript
$uname configCaption 
$dname «аголовок окна  онфигуратора

addins.byUniqueName("global").object.connectGlobals(SelfScript)

”становить«аголовок онфигуратора—о—негопатом()

function macrosѕоказатьЌаименованиеЅазы()
{
    Message("им€ текущей базы = <" + ѕолучитьЌаименованиеЅазы() + ">")
}

// при перезапуске скрипта заголовок будет двоитьс€ - но это будет очень редко, что можно отложить
function ”становить«аголовок онфигуратора—о—негопатом()
{
    ”становить«аголовок—истемы(ѕолучить«аголовок онфигуратора()  + " / Ѕаза: " + ѕолучитьЌаименованиеЅазы() + " / —негопат " + sVersion)
}

function ”становить«аголовок онфигуратораЅез—негопата()
{
    ”становить«аголовок—истемы(ѕолучить«аголовок онфигуратора() + " / Ѕаза: " + ѕолучитьЌаименованиеЅазы())
}

function ѕолучитьЌаименованиеЅазы()
{
    return profileRoot.getValue("CmdLine/IBName").replace(/^\s*|\s*$/g, '');
}

function ѕолучить«аголовок онфигуратора()
{
    заголовок¬„истом¬иде = ѕолучить«аголовок—истемы().replace(/\s*\/\s*Ѕаза\s*.+/ig, '')
    return заголовок¬„истом¬иде;
}

function macrosѕоказатьЌаименованиеЅазыѕоѕути Ќей()
{
    строка—оединени€ = —трока—оединени€»нформационнойЅазы();
    var baseName = ѕолучитьЌаименованиеЅазы1C»з‘айла«апуска(строка—оединени€)
    Message("им€ текущей базы = <" + baseName + ">")
}

function ”становить«аголовок онфигуратора_—тарый()
{
    —тарый«аголовок = ѕолучить«аголовок онфигуратора()
    строка—оединени€ = —трока—оединени€»нформационнойЅазы();
    
    наименованиеЅазы = ѕолучитьЌаименованиеЅазы1C»з‘айла«апуска(строка—оединени€)
    ”становить«аголовок—истемы(—тарый«аголовок  + " / " + наименованиеЅазы + " / —негопат " + sVersion)
}

function ѕолучитьЌаименованиеЅазы1C»з‘айла«апуска(строка—оединени€)
{
    // удобно юзать из профил€ CmdLine\IBName
    if(!строка—оединени€)
        return null

    var fso = new ActiveXObject("Scripting.FileSystemObject");

        //appDataPath = wsh.ExpandEnvironmentStrings("%AppData%")
        //Path1C = appDataPath + "\\1C\\1CEStart\\ibases.v8i"
    var appDataPath = profileRoot.getValue("Dir/AppData")
    Path1C = appDataPath + "..\\1CEStart\\ibases.v8i"

    if(!fso.FileExists(Path1C)){
    	Message("‘айл <"+Path1C + "> не существует.")
    	return
    }
    var File = fso.GetFile(Path1C)

	var textDoc = v8New("“екстовыйƒокумент")
	textDoc.ѕрочитать(Path1C)

        // вариант orefkov-а по вызову функций из VBScript - »ћ’ќ неудобно работать с доп.переменными :(
	    //var vbs = addins.byUniqueName("vbs").object
        //  vbs.var1 = line
        //  vbs.var2 = строка—оединени€
        //	vbs.result = ""
        //	var pos = vbs.DoEval("InStr(var1,var2)") //чтобы вручную не исправл€ть все символы, не подход€щие дл€ RegExp
	
	// а здесь пр€мой и удобный вызов любых функций
	var vbs = addins.byUniqueName("vbs2").object
    var InStr = vbs.vb.Function('InStr'); //var InStr = vbs.Function('InStr'); // без vbs.vb не работает

    re_baseName = /^\s*\[\s*(.+)\s*\]\s*$/ig // им€ базы без учета начальных и конечных пробелов
    re_connectString = /Connect=.*/ig // строка соединени€
    
	var lineCount = textDoc. оличество—трок()
	var currName = ""
	for(var lineNum = 1; lineNum <= lineCount; lineNum++)
	{
		var line = textDoc.ѕолучить—троку(lineNum); //.replace(/^\s*|\s*$/g, '')	// Ёто такой —окрЋѕ по JScript'овски
//		if(0 == line.length || '//' == line.substr(0, 2))	// ѕропускаем пустые строки и комментарии
//			continue
        var re_res = line.match(re_baseName)
        if(re_res){
            currName = RegExp.$1.replace(/^\s*|\s*$/g, '')	// Ёто такой —окрЋѕ по JScript'овски
            continue
        }
        var re_res = line.match(re_connectString)
        if(!re_res) continue
		
		строка—оединени€ = —трока—оединени€»нформационнойЅазы();
        var pos = line.indexOf(строка—оединени€) //InStr(line, строка—оединени€)
	    if(-1 != pos)
            break
    }
    return 0 == currName.length ? null : currName;
}

function macrosѕоказать—троку—оединени€»Ѕ()
{
     аталог»Ѕ = Ќ—тр(—трока—оединени€»нформационнойЅазы(), "File")
    if( аталог»Ѕ)
        строка—оединени€ =  аталог»Ѕ
    else
        строка—оединени€ = Ќ—тр(—трока—оединени€»нформационнойЅазы(), "Srvr") + ":" + Ќ—тр(—трока—оединени€»нформационнойЅазы(), "Ref")
    Message(строка—оединени€)
}