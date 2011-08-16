$engine JScript
$uname autosave
$dname Автосохранение

// Подключим скрипт с стандартными командами
SelfScript.addNamedItem("stdcommands", addins.byUniqueName('stdcommands').object)

// Восстановим настройки
var pflAutoSaveEnable = "Autosave/Enable"		// Зададим путь в профайле
var pflAutoSaveInterval = "Autosave/Interval"
// Для начала надо создать ключи в настройках, указав их дефолтные значения, а также
// в каком хранилище их сохранять, иначе setValue не будет работать.
// Будем сохранять в хранилище снегопата.
profileRoot.createValue(pflAutoSaveEnable, false, pflSnegopat)
profileRoot.createValue(pflAutoSaveInterval, 60, pflSnegopat)
// Теперь прочитаем актуальные значения из профайла
var enabled = profileRoot.getValue(pflAutoSaveEnable)
var interval = profileRoot.getValue(pflAutoSaveInterval)
var lastSaveTime = new Date().getTime() / 1000

// Всю работу будем делать во время простоя программы
function Designer::onIdle()
{
	if(!enabled)
		return
	var dt = new Date().getTime() / 1000
	if(dt - lastSaveTime > interval)
	{
		// Сохраним конфигурацию
		stdcommands.Config.Save.send()
		// Сохраним текущий файл
		stdcommands.Frame.FileSave.send()
		lastSaveTime = dt
	}
}

// Макрос для вызова окна настройки
function macrosНастройкаАвтоСохранения()
{
	var pathToForm = SelfScript.fullPath.replace(/js$/, 'ssf')
	// Обработку событий формы привяжем к самому скрипту
	form = loadScriptForm(pathToForm, SelfScript.self)
	form.Включить = enabled
	form.Интервал = interval
	form.ОткрытьМодально()
	form = null
}

// Обработчики нажатий кнопок в форме
function ОкНажатие(Элемент)
{
	// Прочитаем значения из формы и если они изменились, сохраним их
	if(form.Включить != enabled)
	{
		enabled = form.Включить
		profileRoot.setValue(pflAutoSaveEnable, enabled)
	}
	if(form.Интервал != interval)
	{
		interval = form.Интервал
		profileRoot.setValue(pflAutoSaveInterval, interval)
	}
	form.Закрыть()
}

function ОтменаНажатие(Элемент)
{
	form.Закрыть()
}
