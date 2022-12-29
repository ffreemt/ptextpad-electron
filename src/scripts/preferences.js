const inputs = document.getElementsByTagName('input')
for(var i = 0 ; i < inputs.length; i++){
    document.querySelector(`label[for="${inputs[i].name}"]`).style.backgroundColor = inputs[i].value
    inputs[i].onkeyup = e => {
        document.querySelector(`label[for="${e.target.name}"]`).style.backgroundColor = e.target.value
    }
}