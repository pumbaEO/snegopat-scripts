$engine JScript
$uname InternalFormExplorer
$dname Исследование форм 1С
$addin stdlib

// Александр Орефков
// Скрипт предназначен для вывода информации о составе контролов, свойствах и событиях
// внутренних форм 1С
stdlib.require("SelectValueDialog.js", SelfScript);

var lastModalForm

function onDoModal(dlgInfo)
{
    if(openModalWnd == dlgInfo.stage && dlgInfo.form)
        lastModalForm = dlgInfo.form
}

events.connect(windows, "onDoModal", SelfScript.self)

function getForm()
{
    if(windows.modalMode == msNone)
    {
        var av = windows.getActiveView()
        return av ? av.getInternalForm() : null
    }
    return lastModalForm
}

function exploreActiveForm(withProps)
{
    var form = getForm()
    if(!form)
        return
    // -1 - это сама форма
    for(var i = -1, k = form.controlsCount; i < k; i++)
    {
        var ctr = form.getControl(i)
        Message("Control #" + i + " name=" + ctr.name + " id=" + ctr.id, mInfo)
        if(withProps)
        {
            var props = ctr.props
            for(var idx = 0, cnt = props.count; idx < cnt; idx++)
            {
                var v = toV8Value(props.getValue(idx))
                Message("\t" + props.propName(idx) + " = " + v.presentation() + "  Тип=" + v.typeName(1) + " " + v.toStringInternal());
            }
        }
    }
}

function enableTrace(enable)
{
    var form = getForm()
    if(form)
        form.trapDialogEvents = enable
}

function macrosПоказатьКонтролыАктивнойФормы()              { exploreActiveForm(false) }
function macrosПоказатьКонтролыАктивнойФормыCоСВойствами()  { exploreActiveForm(true) }
function macrosНачатьОтслеживаниеСобытийАктивнойФормы()     { enableTrace(true) }
function macrosЗавершитьОтслеживаниеСобытийАктивнойФормы()  { enableTrace(false) }
function macrosПоказатьСвойстваКонтрола()
{
    var form = getForm()
    if(!form)
    {
        MessageBox("Нет активной формы")
        return
    }
    var vl = v8New("СписокЗначений")
    vl.Add(-1, "Форма")
    for(var i = 0, k = form.controlsCount; i < k; i++)
        vl.Add(i, form.getControl(i).name)
    var dlg = new SelectValueDialog("Укажите контрол", vl);
    if (dlg.selectValue())
        form.getControl(dlg.selectedValue).props.activateProperty("Имя")
}
