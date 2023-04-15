// ==UserScript==
// @name         Auto display match data & PP Display
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Automatically displays match data after completing a race and displays match PP scores
// @author       Disturbed
// @match        https://keymash.io/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=keymash.io
// @grant        none
// ==/UserScript==

(async function () {
    let star_ratings = await fetch('https://raw.githubusercontent.com/DisturbedProphet/Keymash-PP-display/main/starratings.json').then(res => res.json())

    //This code is from https://github.com/duhby/typing-pp and will likely be subject to change as the PP system is developed further
    function get_score(stars, wpm) {
        return 35 * stars * curve_multiplier(wpm);
    }

    function curve_multiplier(wpm) {
        if (wpm < 100) {
            return wpm * 0.0045;
        }
        else if (wpm < 140) {
            return (wpm * 0.01) - 0.55;
        }
        else if (wpm < 214) {
            return (wpm * 0.0128378) - 0.947297;
        }
        else {
            return 0.102232 * (1.01349 ** wpm);
        }
    }

    //returns a promise that resolves once a given element is created
    function waitForElm(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    resolve(document.querySelector(selector));
                    observer.disconnect();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }


    while (true) {

        //delays the program until the countdown starts
        await waitForElm("#countdownTimer")

        //waits until the test is finished and automatically clicks the match button to display the match stats
        let matchButton = await waitForElm('#matchEnd > div > button:nth-child(2)').then(elm => elm.click());

        let quote = document.querySelector('#matchEnd > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div:nth-child(2)').innerText.split('\n').join(' ');
        let stars;
        try {
            stars = star_ratings[quote].rating;
        } catch (err) {
            console.log(star_ratings);
            console.log(quote)
        }

        //clone the WPM display div and replaces the contents with the proper PP data
        let ppDiv = document.querySelector("#matchEnd > div.bg-black.bg-opacity-20.h-auto.lg\\:min-h-128.rounded-b-2xl.shadow-lg.p-4.sm\\:p-6.md\\:p-8.relative > div.text-white > div > div.col-span-full.md\\:col-span-1 > div > div:nth-child(2)").cloneNode(true);
        let statsContainer = document.querySelector("#matchEnd > div.bg-black.bg-opacity-20.h-auto.lg\\:min-h-128.rounded-b-2xl.shadow-lg.p-4.sm\\:p-6.md\\:p-8.relative > div.text-white > div > div.col-span-full.md\\:col-span-1 > div");
        ppDiv.children[0].innerText = "Performance Points";
        statsContainer.appendChild(ppDiv);

        let wpmElm = await waitForElm("#matchEnd > div > div > div > div > div > div:nth-child(1) > div:nth-child(2) > span");

        const observer = new MutationObserver((mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.target === wpmElm && mutation.addedNodes.length) {
                    ppDiv.children[1].innerText = get_score(stars, parseFloat(wpmElm.innerText)).toFixed(2);
                    console.log(wpmElm)
                }
            }
        });

        observer.observe(wpmElm, { childList: true, subtree: true });
    }
})();
