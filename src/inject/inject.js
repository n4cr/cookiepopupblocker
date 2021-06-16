const skipNodes = []
let sucessDone = false;

function treatAsUTC(date) {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
}

function daysBetween(startDate, endDate) {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const num = (treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay;
    return Math.round(num)

}


function increment() {
    chrome.storage.sync.get('blockCount', function (result) {
        const count = result.blockCount == undefined ? 0 : result.blockCount;

        chrome.storage.sync.set({blockCount: count + 1}, function () {

        });

    })

}


function isFixed(node) {
    return ["fixed", "sticky"].includes(getComputedStyle(node).position)
}


function processScroll() {
    if (document.body == null) {
        return
    }
    document.body.style.setProperty("overflow", "visible", "important");
    document.documentElement.style.setProperty("overflow", "visible", "important");

}

function success() {
    if (sucessDone) {
        return
    }
    const box = document.createElement('div');

    chrome.storage.sync.get('blockCount', function (result) {
        const count = result.blockCount == undefined ? 0 : result.blockCount;
        box.innerText = `Cookie Popup Blocked. Total Blocked: ${count}`;
    });

    box.classList.add('popupblockersuccess')
    document.body.appendChild(box);
    skipNodes.push(box)
    sucessDone = true
    box.addEventListener('animationend', () => {
        box.remove()
    })
}

function removePopup(node) {

    node.remove()
    processScroll();
    success();
    increment()
}


function isCookieNotice(node) {
    const attrs = [
        node.id,
        node.className,
        node.getAttribute('aria-label')
    ]
    return attrs.some(attr => /(cookie|gdpr|consent|privacy|opt-in)/i.test(node.innerHTML))
}

function processNode(node) {
    if (isCookieNotice(node)) {
        if (isFixed(node)) {
            removePopup(node)
            return
        }
        for (const child of node.children) {
            if (isFixed(child)) {
                child.remove()
                return
            }
        }

    }


}

// Observe page
const node = document.getElementsByTagName('body')[0]
const config = {attributes: true, childList: true, subtree: true};

// Callback function to execute when mutations are observed
const tags = ["FORM", "DIV", "SECTION", "ARTICLE", "BODY"]
const callback = function (mutationsList, observer) {
    for (let mutation of mutationsList) {
        if (mutation.addedNodes != null && mutation.addedNodes.length != 0) {
            for (const node of mutation.addedNodes) {
                if (!tags.includes(node.tagName)) {
                    continue
                }
                if (node.nodeType != Node.ELEMENT_NODE) {
                    continue
                }
                if (skipNodes.includes(node)) {
                    continue;
                }
                processNode(node)
            }
        } else if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const node = mutation.target
            processNode(node)
        }
    }

}

const url = window.location.href;
const hostnameRegex = /\/\/([\.\-\_\w]+)/i
const hostname = url.match(hostnameRegex)[1]

// Skip if it was requested
chrome.storage.sync.get(hostname, res => {
    if (res[hostname] !== 'skip') {
        document.querySelectorAll("form, div, section, article").forEach(function (node) {
            processNode(node)
        });

        const observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
        observer.observe(node, config);
    }
})


