const homeScore = document.getElementById("homeScore");
const awayScore = document.getElementById("awayScore");
const minute = document.getElementById("minute");
const eventText = document.getElementById("eventText");

const popup = document.getElementById("popup");
const popupScore = document.querySelector(".popup-score");
const popupEvent = document.querySelector(".popup-event");

const followButton = document.getElementById("followButton");

let following = false;

followButton.addEventListener("click", () => {

    following = !following;

    if (following) {

        followButton.textContent = "⭐ Partita seguita";
        followButton.style.background = "#16a34a";

    } else {

        followButton.textContent = "⭐ Segui questa partita";
        followButton.style.background = "#2d7cff";

    }

});

function showPopup(score, event) {

    popup.classList.add("show");

    popupScore.textContent = score;
    popupEvent.textContent = event;

    setTimeout(() => {

        popup.classList.remove("show");

    }, 5000);

}

const timeline = [

    {
        minute: "Pre-Partita",
        home: 0,
        away: 0,
        event: "Le squadre stanno entrando in campo."
    },

    {
        minute: "1'",
        home: 0,
        away: 0,
        event: "⚽ Calcio d'inizio!"
    },

    {
        minute: "23'",
        home: 1,
        away: 0,
        event: "⚽ GOL FRANCIA - Mbappé"
    },

    {
        minute: "45+2'",
        home: 1,
        away: 0,
        event: "⏸ Fine primo tempo"
    },

    {
        minute: "61'",
        home: 1,
        away: 0,
        event: "🟨 Ammonito Hakimi"
    },

    {
        minute: "74'",
        home: 2,
        away: 0,
        event: "⚽ GOL FRANCIA - Dembélé"
    },

    {
        minute: "89'",
        home: 2,
        away: 1,
        event: "⚽ GOL MAROCCO - En-Nesyri"
    },

    {
        minute: "90+5'",
        home: 2,
        away: 1,
        event: "🏁 FINE PARTITA"
    }

];

let index = 0;

function updateMatch() {

    if (index >= timeline.length)
        return;

    const item = timeline[index];

    homeScore.textContent = item.home;
    awayScore.textContent = item.away;

    minute.textContent = item.minute;

    eventText.textContent = item.event;

    showPopup(
        `Francia ${item.home} - ${item.away} Marocco`,
        item.event
    );

    index++;

}

updateMatch();

setInterval(updateMatch, 6000);
