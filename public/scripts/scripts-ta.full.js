// Al caricamento completo della pagina avvia il gioco e il timer del salvataggio
window.addEventListener("load", startGame);

// Controlla che il gioco si fermi quando non è in primo piano per evitare glitch
var repeat;
window.addEventListener("blur", stopGame);
window.addEventListener("focus", startGame);

var dolciSpan = document.getElementById("dolci");
var dolci = parseInt($("#dolci").text());

// Avvia il conto alla rovescia
var timeleft = 60;
var downloadTimer = setInterval(function(){
    timeleft--;
    document.getElementById("countdowntimer").textContent = timeleft + " secondi rimanenti";
    if(timeleft <= 0){
        saveGame();
        stopGame();
        clearInterval(downloadTimer);
        $("img").remove;
        clearTimeout(startGame);
        document.getElementById("countdowntimer").textContent = "Tempo scaduto! Il tuo punteggio è stato salvato"
    }
},1000);

function startGame() {
    stopGame();
    if (timeleft <= 0) {
        return;
    } else {
        // Genera le coordinate casuali di zucche e pipistrelli, ne carica l'immagine e gli assegna l'id
        var gab = document.createElement("img");
        var rX = Math.floor(Math.random()*($(window).width()-($(window).width()/11.36)+1)); // Coordinate relative alle dimensioni dell'oggetto nel css
        var rY = Math.floor(Math.random()*($(window).height()-($(window).height()/4.62)+1));
        gab.setAttribute("src", "img/gaben.png");
        gab.setAttribute("id", "gaben");
        gab.setAttribute('draggable', false);

        // Spawna le immagini e ne determina il ritmo
        document.getElementById("level").appendChild(gab);
        gaben.onclick=arraffa;
        $("#gaben").css ("left" , rX+"px");
        $("#gaben").css ("top" , rY+"px").fadeIn(100).delay(400).fadeOut(100, function(){
        	$(this).remove();
        });

        var bat = document.createElement("img");
        var bX = Math.floor(Math.random()*($(window).width()-($(window).width()/6.4)+1)); // Coordinate relative alle dimensioni dell'oggetto nel css
        var bY = Math.floor(Math.random()*($(window).height()-($(window).height()/3.13)+1));
        bat.setAttribute("src", "img/bat.gif");
        bat.setAttribute("id", "bats");
        bat.setAttribute('draggable', false);

        document.getElementById("level").appendChild(bat);
        bats.onclick=sgraffigna;
        $("#bats").css ("left" , bX+"px");
        $("#bats").css ("top" , bY+"px").fadeIn(100).delay(400).fadeOut(100, function(){
        	$(this).remove();
        });

		repeat = setTimeout(startGame, 900);
    }
}

// Ferma il timer e cancella gli oggetti
function stopGame() {
	clearTimeout(repeat);
	$("img").remove();
}

// Zucca: aumenta punteggio
function arraffa() {
    dolci++;
    dolciSpan.innerHTML=Math.round(dolci);
    scorePlus();
}
function scorePlus() {
    $.ajax({
        type: 'POST',
        url: '/scoreplustimeattack'
    }).done(function( response ) {
        if (response.msg === '') {
            //
        } else {
            alert(response.msg);
        }
    });
}

// Pipistrello: dimezza il punteggio
function sgraffigna() {
    dolci=dolci/2;
    dolciSpan.innerHTML=Math.round(dolci);
    scoreHalf();
}
function scoreHalf() {
    $.ajax({
        type: 'POST',
        url: '/scorehalftimeattack'
    }).done(function( response ) {
        if (response.msg === '') {
            //
        } else {
            //
        }
    });
}

// Salva sessione in database ogni minuto
function saveGame() {
    var user = $('#steamid').attr('rel');
    $.ajax({
        type: 'POST',
        url: '/savegametimeattack/' + user
    }).done(function( response ) {
        if (response.msg === '') {
            //
        } else {
            console.log(response.msg);
        }
        // saveGameTimer();
    });
};
