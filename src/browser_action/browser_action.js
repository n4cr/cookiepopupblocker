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


function hide(element) {
    element.classList.add('hidden')
}

function show(element) {
    element.classList.remove('hidden')
}


function showCount() {
    const countEl = document.getElementById('count')
    chrome.storage.sync.get('blockCount', function (result) {
        const count = result.blockCount == undefined ? 0 : result.blockCount;
        countEl.innerText = count
    });
}


async function prepareButtons() {
    const button = document.getElementById('excludeButton')

    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        const hostnameRegex = /\/\/([\.\-\_\w]+)/i
        const activeTab = tabs[0];
        const hostname = activeTab.url.match(hostnameRegex)[1]


        chrome.storage.sync.get(hostname, res => {
            if (res[hostname] === 'skip') {
                button.classList.remove('button')
                button.classList.add('buttonInclude')
                button.innerText = 'Include this website'
            } else {
                button.classList.add('button')
                button.classList.remove('buttonInclude')
                button.innerText = 'Exclude this website'
            }
        });
    });


    button.addEventListener('click', (event) => {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            const hostnameRegex = /\/\/([\.\-\_\w]+)/i
            const activeTab = tabs[0];
            const hostname = activeTab.url.match(hostnameRegex)[1]

            chrome.storage.sync.get(hostname, res => {
                if (res[hostname] !== 'skip') {
                    chrome.storage.sync.set({[hostname]: 'skip'}, (e) => {
                        chrome.tabs.reload(tabs[0].id)
                    })

                } else {
                    chrome.storage.sync.remove(hostname, (e) => {
                        chrome.tabs.reload(tabs[0].id)
                    })

                }
            })

        });
    })
}

showCount();
prepareButtons()
