let klok = {
    "orientation": "auto",
    "timer": 2,
    "time": 60, /* s */
    "interval": 61, /* ms */
};

let timers = [];

function getOrientation() {
    switch(klok['orientation']) {
    case "landscape":
    case "portrait":
        return klok['orientation'];
    case "auto":
    default:
        return window.innerWidth > window.innerHeight ? "landscape" : "portrait";
    }
}

function updateOrientation() {
    let orientation = getOrientation();
    if (!board.classList.contains(orientation)) {
        board.classList.remove("landscape");
        board.classList.remove("portrait");
        board.classList.add(orientation);
    }
}

function addTimer(time, interval) {
    let timerElt = document.createElement('div');
    timerElt.classList.add('timer');
    let timer = new Timer(
        (t) => { timerElt.innerText = t.getTime(); },
        time,
        interval
    );
    timerElt.onclick = () => {
        let currentIndex = timers.indexOf(timer);
        if (timer.state === 1
            || (timers.filter((t) => t.state !== 1)).length == timers.length
           ) {
            timer.pause();
            timers[(currentIndex+1)%(timers.length)].resume();
        }
    };
    if (board.children.length != 0) {
        let sepElt = document.createElement('div');
        sepElt.classList.add('sep');
        let sepActionElt = document.createElement('div');
        sepActionElt.classList.add('action');
        sepActionElt.onclick = clickAction;
        sepActionElt.innerText = "⟳";
        let sepOptionsElt = document.createElement('div');
        sepOptionsElt.classList.add('options');
        sepOptionsElt.onclick = clickOptions;
        sepOptionsElt.innerText = "⚙";
        sepElt.appendChild(sepActionElt);
        sepElt.appendChild(sepOptionsElt);
        board.appendChild(sepElt);
    }
    board.appendChild(timerElt);
    return timer;
}

function toggleAction() {
    document.querySelectorAll('.action').forEach((elt) => {
        if (getIsAllPaused()) {
            elt.innerText = "⟳";
        } else {
            elt.innerText = "⏸";
        }
    });
}

function getIsAllPaused() {
    let isAllPaused = true;
    timers.forEach((timer) => {
        if (timer.state === 1) {
            isAllPaused = false;
        }
    });
    return isAllPaused;
}

function clickAction() {
    let isAllPaused = getIsAllPaused();
    if (isAllPaused) {
        if (confirm('reset?')) {
            timers.forEach((timer) => {
                timer.stop();
                timer.init();
            });
        }
    } else {
        timers.forEach((timer) => {
            timer.pause();
        });
    }
}

function clickOptions(evt) {
    if (evt.target.classList.contains('options') || evt.target.id == "options") {
        const options = document.getElementById('options');
        if (options.style.display != "block") {
            options.style.display = "block";
        } else {
            options.style.display = "none";
        }
    }
}

function updateTimer() {
  timers = [];
  board.innerHTML = '';
  initTimer();
}

function initTimer() {
    for(let i = 0; i < klok['timer']; i++) {
        timers[i] = addTimer(klok['time'], klok['interval']);
    }
}

function loadOptions() {
    klok['orientation'] = localStorage.getItem("orientation") || klok['orientation'];
    klok['timer'] = localStorage.getItem("timer") || klok['timer'];
    klok['time'] = localStorage.getItem("time") || klok['time'];
    klok['interval'] = localStorage.getItem("interval") || klok['interval'];
    document.querySelector('input[name="orientation"][value="'+klok['orientation']+'"]').checked = "checked";
    document.querySelectorAll('input[name="orientation"]').forEach((elt) => {
        elt.onclick = function() {
            klok['orientation'] = elt.value;
            localStorage.setItem("orientation", elt.value);
            updateOrientation();
        };
    });
    const timerElt = document.querySelector('input[name="timer"]');
    timerElt.value = klok['timer'];
    timerElt.oninput = function() {
      klok['timer'] = timerElt.value;
      localStorage.setItem("timer", timerElt.value);
      updateTimer();
    };
    const timeElt = document.querySelector('input[name="time"]');
    timeElt.value = klok['time'];
    timeElt.oninput = function() {
      klok['time'] = timeElt.value;
      localStorage.setItem("time", timeElt.value);
      updateTimer();
    };
    const intervalElt = document.querySelector('input[name="interval"]');
    intervalElt.value = klok['interval'];
    intervalElt.oninput = function() {
      klok['interval'] = intervalElt.value;
      localStorage.setItem("interval", intervalElt.value);
      updateTimer();
    };
}


screen.orientation.onchange = updateOrientation;
window.onresize = updateOrientation;

window.onload = () => {
    "use strict";
    const board = document.getElementById('board');
    const options = document.getElementById('options');
    options.onclick = clickOptions;
    loadOptions();
    updateOrientation();
    initTimer();
};

function Timer(callback, time, interval) {
    this.callback = callback;
    this.interval = interval; /* ms */
    this.initialTime = time; /* s */
    this.time = time * 1000; /* s */
    this.state = 0; /*  0 = idle, 1 = running, 2 = paused */

    this.proxyCallback = () => {
        this.time = this.time - this.interval;
        if(this.time <= 0){
            this.stop();
            return;
        }
        this.callback(this);
    };

    this.init = () => {
        this.time = this.initialTime * 1000;
        this.setState(0);
        this.callback(this);
    };

    this.pause = () => {
        if (this.state != 1) return;
        clearInterval(this.timerId);
        this.setState(2);
    };

    this.resume = () => {
        if (this.state != 0 && this.state != 2) return;
        this.timerId = setInterval(() => this.proxyCallback(), this.interval);
        this.setState(1);
    };

    this.stop = () => {
        if (this.state === 0) return;
        this.time = 0;
        clearInterval(this.timerId);
        this.callback(this);
        this.setState(0);
    };

    this.getTime = () => {
        const date = new Date(this.time);
        let min = (''+date.getMinutes()).padStart(2,'0');
        let sec = (''+date.getSeconds()).padStart(2,'0');
        let mil = (''+date.getMilliseconds()).padStart(3,'0');
        return `${min}:${sec}.${mil}`;
    };

    this.setState = (state) => {
        this.state = state;
        toggleAction();
    };

    this.callback(this);
}

