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

function initialise() {
    chrome.storage.sync.get('setupDate', function (result) {
        if (!result.setupDate) {
            const date = new Date().toISOString()
            chrome.storage.sync.set({setupDate: date}, function () {
            });
        }
        console.log(new Date(result.setupDate))
    });
}

function isFixed(node) {
    return ["fixed", "sticky"].includes(getComputedStyle(node).position)
}

function isOverlay(node) {
    const computed = getComputedStyle(node)
    const height = node.offsetHeight
    const width = node.offsetWidth
    const perhapsOverlay = height > window.innerHeight * 0.7 && width > window.innerWidth * 0.7
    return computed.zIndex >= 5000 && perhapsOverlay
}

function processScroll() {
    if (document.body == null) {
        return
    }
    document.body.style.setProperty("overflow", "visible", "important");
    document.documentElement.style.setProperty("overflow", "visible", "important");

    // node.style["overflow"] = "visible !important";
    // node.style["overflow-x"] = "visible";
    // node.style["overflow-y"] = "visible"
    // node.style["position"] = "static !important"
    //
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

    // Go ahead
    node.remove()
    processScroll();
    success();
    increment()
}

function injectHelperLink(node) {
    const link = document.createElement('a');
    link.target = '_blank'
    link.href = 'https://gumroad.com/l/cookie-popup-blocker'
    link.innerText = 'Get rid of Cookie Popups'
    link.classList.add('helperlink')
    node.appendChild(link)
}

function processNode(node) {

    if (isFixed(node)) {
        const text = node.innerHTML.toLowerCase()
        if (isOverlay(node) || text.includes('cookie') || text.includes('consent') || text.includes('gdpr')) {
            // Check the user is subscribed and trial expired
            chrome.storage.sync.get(['subscribed', 'setupDate'], result => {
                const setupDate = result.setupDate ? new Date(result.setupDate) : new Date()
                const days = daysBetween(setupDate, new Date())
                const daysLeft = days < 7 ? 7 - days : 0;

                if (result.subscribed) {
                    removePopup(node)
                } else {
                    if (daysLeft > 0) {
                        // Trial period
                        removePopup(node)

                    } else {
                        injectHelperLink(node)
                    }
                }
            })


        }
    }
}

document.querySelectorAll("form, div, section, article").forEach(function (node) {
    processNode(node)
});

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
const observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
observer.observe(node, config);

initialise()
processScroll()
