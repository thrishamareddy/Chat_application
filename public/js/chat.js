const socket = io();

const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationBtn = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");
const $clearChatBtn = document.querySelector("#clear-chat");

const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector("#location-message-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild;

    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    const visibleHeight = $messages.offsetHeight;

    const containerHeight = $messages.scrollHeight;

    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
};

const saveMessagesToLocal = (messages) => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
};

const getMessagesFromLocal = () => {
    const messages = localStorage.getItem('chatMessages');
    return messages ? JSON.parse(messages) : [];
};

const displayMessages = (messages) => {
    $messages.innerHTML = '';
    messages.forEach(message => {
        const alignment = message.username === username ? 'message--right' : 'message--left';
        if (message.location) {
            const html = Mustache.render(locationMessageTemplate, {
                username: message.username,
                url: message.url,
                createdAt: moment(message.createdAt).format("h:mm a"),
                alignment
            });
            $messages.insertAdjacentHTML("beforeend", html);
        } else {
            const html = Mustache.render(messageTemplate, {
                username: message.username,
                message: message.text,
                createdAt: moment(message.createdAt).format("h:mm a"),
                alignment
            });
            $messages.insertAdjacentHTML("beforeend", html);
        }
    });
    autoscroll();
};

document.addEventListener("DOMContentLoaded", () => {
    const savedMessages = getMessagesFromLocal();
    displayMessages(savedMessages);
});

socket.on("message", message => {
    const savedMessages = getMessagesFromLocal();
    savedMessages.push({
        username: message.username,
        text: message.text,
        createdAt: message.createdAt
    });
    saveMessagesToLocal(savedMessages);

    const alignment = message.username === username ? 'message--right' : 'message--left';
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a"),
        alignment
    });

    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("locationMessage", message => {
    const savedMessages = getMessagesFromLocal();
    savedMessages.push({
        username: message.username,
        url: message.url,
        createdAt: message.createdAt,
        location: true
    });
    saveMessagesToLocal(savedMessages);

    const alignment = message.username === username ? 'message--right' : 'message--left';
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("h:mm a"),
        alignment
    });

    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });

    document.querySelector("#sidebar").innerHTML = html;
});

$messageForm.addEventListener("submit", e => {
    e.preventDefault();

    $messageFormButton.setAttribute("disabled", "disabled");

    const message = e.target.elements.message.value;

    socket.emit("sendMessage", message, error => {
        $messageFormButton.removeAttribute("disabled");
        $messageFormInput.value = "";
        $messageFormInput.focus();

        if (error) {
            return console.log(error);
        } else {
            console.log("Message delivered!");
        }
    });
});

$sendLocationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser.");
    } else {
        $sendLocationBtn.setAttribute("disabled", "disabled");

        navigator.geolocation.getCurrentPosition(position => {
            socket.emit(
                "sendLocation",
                {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                },
                error => {
                    $sendLocationBtn.removeAttribute("disabled");
                    if (!error) {
                        console.log("Location shared!");
                    }
                }
            );
        });
    }
});

$clearChatBtn.addEventListener("click", () => {
    localStorage.removeItem('chatMessages');
    $messages.innerHTML = '';
});

socket.emit("join", { username, room }, error => {
    if (error) {
        alert(error);
        location.href = "/";
    }
});
