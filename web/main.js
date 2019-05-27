$('document').ready(function () {

    var socket = io.connect("http://localhost:8080");

    var recording = false;
    var id;
    var timeouId;
    URL = window.URL || window.webkitURL;

    var gumStream;
    var rec;
    var input;
    var gender;

    var audioPlayer = document.createElement('audio');

    getMedia();



    var quotes = [
        `70% des gens passent leurs nuits à se remémorer des conversations passées et à imaginer ce qu'ils auraient dû dire.`,
        `Chaque kilogramme supplémentaire à bord d'une fusée spatiale nécessite 530 kg de carburant.`,
        `Si vous vous trouvez au fond d'un puits ou d'une cheminée, regarder vers le haut vous permettra de voir les étoiles, même en plein jour.`,
        `Dans le Rhode Island, à Providence, il est illégal de vendre du dentifrice et une brosse à dents au même client un dimanche.`,
        `Au Japon, il est acceptable de s'endormir au travail, ça montre que vous travaillez dur !`,
        `Beaucoup de suicides au Japon, c’est un fait connu. Mais saviez-vous que si une personne se suicide en se jetant sous un train, sa famille devra payer une amende ?`,
        `Il est illégal de porter une fausse moustache qui puisse causer des rires à l'église (Alabama).`,
        `À San Francisco, il est illégal de nettoyer sa voiture avec des sous-vêtements usagés.`,
        `À Quitman, il est illégal pour un poulet de traverser la route.`,
        `Il est illégal de changer les vêtements d'un mannequin de vitrine sans baisser le rideau.`,
        `À Wichita, les mauvais traitements infligés à une belle-mère ne peuvent être retenus comme motif de divorce.`,
        `Tous les citoyens se doivent d'avoir chez eux une botte de foin, juste au cas où le roi passerait avec son cheval.`,
        `Les ovnis n'ont pas le droit d'atterrir à Châteauneuf du Pape.`,
        `Au Danemark, il est interdit de démarrer une voiture si quelqu'un se trouve dessous.`,
        `Il est interdit de se marier avec son oncle ou sa tante (sauf si le président de la République est pour...).`,
        `Il est légal de tuer un Ecossais dans les murs de l’ancienne ville d’York (nord de l’Angleterre) seulement s’il porte un arc et des flèches.`,
        `Au Danemark, lorsque vous conduisez, vous devez avoir quelqu’un en face de votre voiture avec un drapeau, pour avertir les calèches qu’une automobile est à venir.`,
    ];

    displayNewQuote();

    $('#recordBtn').on('click', () => {
        if (!recording) {
            ///Start recording
            startRecording();
        }
        else {
            ///Stop recording
            finnishRecording();
        }
    });

    function startRecording() {
        recording = true;
        var recordDuration = 5000;
        bar = new ProgressBar.Circle('#circle', {
            strokeWidth: 6,
            duration: recordDuration,
            color: '#2c3e50',
            trailWidth: 1,
            svgStyle: null,

        });
        bar.animate(1);
        timeouId = setTimeout(() => {
            finnishRecording();
        }, recordDuration);
        rec.record();
    }

    function showLoad() {
        var opacity = 0;
        var appearing = true;
        var val = 0.04;
        var male = true;
        showElement('loadCont');
        document.getElementById("maleLoad").style.opacity = 0;
        document.getElementById("femaleLoad").style.opacity = 0;
        id = setInterval(() => {
            if (male) {
                document.getElementById("maleLoad").style.opacity = opacity;
                //console.log("M : " + opacity);
            }
            else {
                document.getElementById("femaleLoad").style.opacity = opacity;
                //console.log("M : " + opacity);
            }

            if (appearing) {
                opacity += val;
                if (opacity > 1) appearing = false;
            }
            else {
                opacity -= val;
                if (opacity < 0) {
                    appearing = true;
                    male = !male;
                }
            }

        }, 10);
    }

    function stopLoading() {
        clearInterval(id);
        hideElement('loadCont');
    }

    function finnishRecording() {
        recording = false;
        $('#circle').html('');
        clearTimeout(timeouId);
        // hide elements
        hideElement('recordCont');
        //show loading
        showLoad();
        // emit prediction request
        rec.stop();
        gumStream.getAudioTracks()[0].stop();
        rec.exportWAV(createDownloadLink);
    }

    $('#newRecord').on('click', () => {
        displayNewRecording();
    });

    function displayNewQuote() {
        var index = Math.floor(Math.random() * quotes.length);
        $('#quoteText').text(`" ${quotes[index]} "`);
    }


    socket.on('prediction', function (prediction) {
        var result = prediction[0];
        console.log(result);
        gender = result.genderXGB;
        stopLoading();
        displayResult(result);
        showElement('responseCont');
        hideElement('loadCont');
        showElement('detailsDiv');
    });

    function displayResult(result) {
        var pourcXGB = (result.genderXGB == 'Male') ? result.valXGB : 1 - result.valXGB;
        var pourcGLM = (result.genderModel == 'Male') ? result.valGLM : 1 - result.valGLM;
        var pourcRandom = (result.genderRandom == 'Male') ? result.valRandomM : result.valRandomF;
        pourcRandom = Math.round(pourcRandom * 100);
        pourcGLM = Math.round(pourcGLM * 100);
        pourcXGB = Math.round(pourcXGB * 100);
        $('#resultGender').text(gender);
        $('#resultPourc').text(`${pourcXGB}%`);
        $('#model1').text(`Model 1: ${result.genderXGB} (${pourcXGB}%)`);
        $('#model2').text(`Model 2: ${result.genderModel} (${pourcGLM}%)`);
        $('#model3').text(`Model 3: ${result.genderRandom} (${pourcRandom}%)`);
    }

    $('#btnRight').on('click', () => {
        if (gender == 'MaFemalele') addInput('female');
        if (gender == 'Male') addInput('male');
        displayNewRecording();
    });

    $('#btnWrong').on('click', () => {
        if (gender == 'Male') addInput('female');
        if (gender == 'Female') addInput('male');
        displayNewRecording();

    });

    function addInput(gender) {
        socket.emit('addNewInput', gender);
        showAlert();
    }

    function getMedia() {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        var audioContext = new AudioContext;
        var constraints = { audio: true, video: false }
        navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
            console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

            gumStream = stream;
            input = audioContext.createMediaStreamSource(stream);
            rec = new Recorder(input, { numChannels: 1 });
            console.log("new recorder");

        }).catch(function (err) {
            console.log("erreur getting media");
        });
    }

    function displayNewRecording() {
        hideElement('detailsDiv');
        hideElement('responseCont');
        showElement('recordCont');
        displayNewQuote();
        getMedia();
    }

    function createDownloadLink(blob) {
        var url = URL.createObjectURL(blob);
        //$('#playerControler').attr('src', url);
        socket.emit('audioBlob', blob);

        audioPlayer.src = url;
    }

    // WAVES
    var waves = new SineWaves({
        el: document.getElementById('waves'),
        speed: 4,
        height: '20%',
        width: function () {
            return $(window).width();
        },

        height: function () {
            return $(window).height();
        },

        ease: 'SineInOut',
        wavesWidth: '100%',
        waves: [
            {
                timeModifier: 4,
                lineWidth: 2,
                amplitude: -25,
                wavelength: 25
            },
            {
                timeModifier: 2,
                lineWidth: 2,
                amplitude: -50,
                wavelength: 50
            },
            {
                timeModifier: 1,
                lineWidth: 1,
                amplitude: -100,
                wavelength: 100
            },
        ],

        // Called on window resize
        resizeEvent: function () {
            var gradient0 = this.ctx.createLinearGradient(0, 0, this.width, 0);
            var gradient1 = this.ctx.createLinearGradient(0, 0, this.width, 0);
            var gradient2 = this.ctx.createLinearGradient(0, 0, this.width, 0);

            gradient0.addColorStop(0, "rgba(12, 83, 153, 1.0)");
            gradient1.addColorStop(0, "rgba(79, 46, 179, 1.0)");
            gradient2.addColorStop(0, "rgba(122, 29, 170, 1.0)");

            this.waves[0].strokeStyle = gradient0;
            this.waves[1].strokeStyle = gradient1;
            this.waves[2].strokeStyle = gradient2;

            // Clean Up
            gradient0 = void 0;
            gradient1 = void 0;
            gradient2 = void 0;
        }
    });

    function showAlert() {
        $('#alert').show(400);
        setTimeout(() => {
            $('#alert').hide(400);
        }, 3500);
    }
    showAlert();

    $('#closeAlertBtn').on('click', function () {
        $('#alert').hide(400);
    });

    socket.on('error', (err) =>{
        console.log("error");
        gender  = 'Error';
        displayResult({});
        showElement('responseCont');
        hideElement('loadCont');
        showElement('detailsDiv');
        console.log('efter err');
    });

    $(document).bind('keypress', (e) => {
        //console.log(e.which);
        if (e.which == 32) {
            if (!recording) {
                ///Start recording
                startRecording();
            }
            else {
                ///Stop recording
                finnishRecording();
            }
        }

        if (e.which == 112) {
            console.log("p");
            audioPlayer.play();
        }
    });
});


function hideElement(nodeId) {
    $(`#${nodeId}`).hide(0);
}

function showElement(nodeId) {
    $(`#${nodeId}`).show(0);
}

