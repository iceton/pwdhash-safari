/*

Pwdhash-Safari v0.1 (2015-08-04)
Copyright 2015 Todd Iceton (pwdhashsafari@emailbad.com)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/

(function() {

var currentEl, // hashed password comes in a callback -- need this to mark destination
    navKeyCodes = [9, 13, 16, 17, 18, 33, 34, 35, 36, 37, 38, 39, 40, 91, 92];

function PwdhashSafariPasswordElement(el) {
    if (el.dataset.pwdhashSafari) {
        return;
    }
    var data = {
        active: false,
        hash: null,
        originalBackgroundColor: null
    };
    // defining functions in here so event handlers can access data & class functions
    function activatePwdhash() {
        el.addEventListener("blur", hashPassword, true);
        el.addEventListener("keydown", keydownListener, true);
        el.addEventListener("paste", pasteListener, true);
        el.addEventListener("pwdhash", pwdhashListener, true);
        data.active = true;
        data.originalBackgroundColor = el.style.backgroundColor;
        el.style.backgroundColor = "#dff0d8";
        if (el.value === "@@") {
            el.value = "";
        }
        hashPassword();
    }
    function deactivatePwdhash() {
        el.removeEventListener("blur", hashPassword, true);
        el.removeEventListener("keydown", keydownListener, true);
        el.removeEventListener("paste", pasteListener, true);
        el.removeEventListener("pwdhash", pwdhashListener, true);
        data.active = false;
        el.style.backgroundColor = data.originalBackgroundColor;
        el.value = "";
    }
    function hashPassword() {
        // already hashed?
        if (data.hash === el.value) {
            return;
        }
        // do nothing if blank
        if (el.value.length === 0) {
            return;
        }
        // mark current el and send to hash
        currentEl = el;
        safari.self.tab.dispatchMessage(document.location.href, el.value);
        /*
        el.value = result;
        // store hashed value for comparison when modifying, using this.value because result is saving with zero-width characters after it for some reason
        data.hash = el.value;*/
    }
    function keydownListener(e) {
        // check whether hash is needed, don't clear
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || navKeyCodes.indexOf(e.keyCode) !== -1) {
            hashPassword();
            return;
        }
        // clear value if modifying a hashed password
        if (data.hash === el.value) {
            el.value = "";
        }
    }
    function keyupListener(e) {
        // activate?
        if (!data.active) {
            if (e.keyCode === 113 || el.value === "@@") { // F2 or @@
                activatePwdhash();
            }
            return;
        }
        // deactivate only with F2
        if (e.keyCode === 113) {
            deactivatePwdhash();
            return;
        }
    }
    function pasteListener() {
        el.value = "";
    }
    function pwdhashListener(e) {
        console.log(e);
        if (el.value === e.detail.value) {
            el.value = e.detail.hashed;
            data.hash = el.value;
        }
    }
    el.addEventListener("keyup", keyupListener, true);
    el.dataset.pwdhashSafari = "1";
}

// monitor current password inputs
var passwords = document.querySelectorAll("input[type='password']");
for (var i = 0; i < passwords.length; i++) {
    new PwdhashSafariPasswordElement(passwords[i]);
}

// observe dom changes for new password inputs
var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        for (var i = 0; i < mutation.addedNodes.length; i++) {
            var node = mutation.addedNodes[i];
            if (node.nodeType === 1 && node.nodeName === "INPUT" && node.type === "password") {
                new PwdhashSafariPasswordElement(node);
            }
        }
    });
});
observer.observe(document, {
    childList: true,
    subtree: true
});

safari.self.addEventListener("message", function(msgEvent) {
    console.log(msgEvent);
    currentEl.dispatchEvent(new CustomEvent("pwdhash", {
        "detail": {
            "value": msgEvent.name,
            "hashed": msgEvent.message
        }
    }));
}, false);

})();