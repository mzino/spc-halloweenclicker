// Al caricamento completo della pagina avvia il gioco e il timer del salvataggio
window.addEventListener("load", startGame);
window.addEventListener("load", saveGameTimer);

// Controlla che il gioco si fermi quando non è in primo piano per evitare glitch
var repeat;
window.addEventListener("blur", stopGame);
window.addEventListener("focus", startGame);

var dolciSpan = document.getElementById("dolci");
var dolci = parseInt($("#dolci").text());

function startGame() {
    stopGame();
    // Determina lo spawn di un pipistrello o una zucca. Se >= 0.5 = zucca 
    var trickortreat = Math.random();
    if (trickortreat >= 0.5) {
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
        $("#gaben").css ("top" , rY+"px").fadeIn(100).delay(500).fadeOut(100, function(){
        	$("img").remove();
        });
		repeat = setTimeout(startGame, 1000);
    } else {
        var bat = document.createElement("img");
        var bX = Math.floor(Math.random()*($(window).width()-($(window).width()/6.4)+1)); // Coordinate relative alle dimensioni dell'oggetto nel css
        var bY = Math.floor(Math.random()*($(window).height()-($(window).height()/3.13)+1));
        bat.setAttribute("src", "img/bat.gif");
        bat.setAttribute("id", "bats");
        bat.setAttribute('draggable', false);

        document.getElementById("level").appendChild(bat);
        bats.onclick=sgraffigna;
        $("#bats").css ("left" , bX+"px");
        $("#bats").css ("top" , bY+"px").fadeIn(100).delay(500).fadeOut(100, function(){
        	$("img").remove();
        });
		repeat = setTimeout(startGame, 1000);
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
        url: '/scoreplus'
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
        url: '/scorehalf'
    }).done(function( response ) {
        if (response.msg === '') {
            //
        } else {
            //
        }
    });
}

// Salva sessione in database ogni minuto
function saveGameTimer() {
    setTimeout(saveGame, 60000);
}
function saveGame() {
    var user = $('#steamid').attr('rel');
    $.ajax({
        type: 'POST',
        url: '/savegame/' + user
    }).done(function( response ) {
        if (response.msg === '') {
            //
        } else {
            console.log(response.msg);
        }
        saveGameTimer();
    });
};

// ----------DOCUMENT READY start---------- //
$(document).ready(function() {

	// Dialog
	$(function(){
		$("#dialog").dialog({
			minWidth: 400
		});
	});

});
// ----------DOCUMENT READY end------------ //
