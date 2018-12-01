// Coin colors
var coinColorScale = d3.scaleOrdinal(d3.schemeCategory20);

/* Load data */
queue()
    .defer(d3.text, "data/cryptoFinancialData.csv")
    .defer(d3.csv, "data/crime.csv")
    .defer(d3.json, "data/coinTreeAll.json")
    .defer(d3.json, "data/mergedCoinTree.json")
    .defer(d3.csv, "data/txSpeed.csv")
    .defer(d3.json,"data/world-110m.json")
    .defer(d3.tsv, "data/world-110m-country-names.tsv")
    .defer(d3.csv, "data/attitude.csv")
    .defer(d3.csv, "data/legality.csv")
    .defer(d3.csv, "data/cryptoPercent.csv")
    .await(createVis);

function createVis(error, financialData, crimeData, coinTreeJSON, coinTreeFilteredJSON, txData,  mapTopJson, worldTsv, data1, data2, data3) {
    if (error) { console.log(error); }
    //https://howmuch.net/articles/biggest-crypto-hacks-scams
    for (var i in crimeData){
      crimeData[i].loss = +crimeData[i].loss;
    }
    console.log(crimeData);
    for(var i in txData){
      txData[i].txs = +txData[i].txs;
    }
    console.log(txData);
    //transactions speed data
    var chart = bubbleChart().width(600).height(400).showTitleOnCircle(false);
    d3.select("#txChart").datum(txData).call(chart);
    /*** Create dashboards ***/

    /** Dashboard 1 **/

    // Clean Data

    var treeDateParse = d3.timeParse('%m-%Y');

    var coinTreeFilteredData = Object.keys(coinTreeFilteredJSON).map(function(key) {
        return [treeDateParse(key), coinTreeFilteredJSON[key]];
    });

    coinTreeFilteredData.sort(function(a, b) {
        return a[0] - b[0];
    });

    var coinTreeData = Object.keys(coinTreeJSON).map(function(key) {
        return [treeDateParse(key), coinTreeJSON[key]];
    });

    // Create visualization instances
    var treeLineChart = new TreeLineChart('tree-linechart', coinTreeData);
    var familyTree = new FamilyTree("family-tree", coinTreeFilteredData, treeLineChart);



    /* Bind event handlers */

    /** Dashboard 2 - Financial Data **/

    /* Clean data */
    var financeDayParser = d3.timeParse("%b %d, %Y");
    var columns = ["Coin", "Date", "Open", "High", "Low", "Close", "Volume", "MarketCap"];
    var cryptoFinanceData = d3.csvParseRows(financialData).map(function(row, rowI) {
        return row.map(function(value, colI) {
            if (rowI !== 0 && colI >= 2 && colI <= 5) {
                return +value;
            } else if (colI > 5) {
                return +(value.replace(/,/g, ''))
            } else if (colI === 1) {
                return financeDayParser(value);
            }
            return value;
        });
    });
    cryptoFinanceData = cryptoFinanceData.map(function(d) {
        var dayObj = {};
       for (let i = 0; i < d.length; i++) {
           dayObj[columns[i]] = d[i];
       }
       return dayObj;
    });
    // Get rid of header row
    cryptoFinanceData.shift();
    cryptoFinanceData.forEach(function(d) {
       d.Average = (d.High + d.Low) / 2;
    });

    // Get the percentage of the day's total volume transaction for each coin
    var financeByDate = d3.nest()
        .key(function(d) { return d.Date; })
        .rollup(function(d) {
            var totalVolume = d3.sum(d, function(v) { return v.Volume; });
            var data = {};
            d.forEach(function(v) {
                v.VolumePercent = v.Volume / totalVolume * 100;
                data[v.Coin] = v;
            });
            return data;
        })
        .entries(cryptoFinanceData);
    financeByDate.sort(function(a,b) { return new Date(a.key) - new Date(b.key); });
    // No volume data before Dec 27th, 2013
    financeByDate = financeByDate.filter(function(d) { return new Date(d.key) >= new Date(2013, 11, 27); });

    allCoins = Array.from([... new Set(cryptoFinanceData.map(function(d) { return d.Coin; }))]);
    coinColorScale.domain(allCoins);
    // console.log(cryptoFinanceData);
    // console.log(volumeByData);

    /* Create visualization instances */
    var FinanceDashboardEventHandler = {};
    var financeTimeline = new FinanceTimeline("finance-timeline", cryptoFinanceData, FinanceDashboardEventHandler);
    var financeVolumeChart = new FinanceVolumeChart("finance-volume-chart", financeByDate, FinanceDashboardEventHandler);
    var financeTreemap = new FinanceTreemap("finance-treemap", cryptoFinanceData, FinanceDashboardEventHandler);

    /* Bind event handlers */
    $('#finance-historical-button').on('click', function() {
        financeTimeline.onViewChanged('historical');
    });

    $('#finance-detailed-button').on('click', function() {
        financeTimeline.onViewChanged('detailed');
    });

    $(".detailed-arrows").on('click', function() {
        var isDisabled = $(this).hasClass('disabled');
        if (isDisabled) return;

        var id = $(this).attr('id');
        financeTimeline.updateDetailed(id === 'detailed-month-next');
    });

    $('#finance-absolute-button').on('click', function() {
        financeVolumeChart.onUpdateView('absolute');
    });

    $('#finance-percent-button').on('click', function() {
        financeVolumeChart.onUpdateView('percent');
    });

    tippy(document.querySelector("#detailed-info"), {
        content: document.querySelector('#detailed-info-popper')
    });

    $(FinanceDashboardEventHandler).bind("selectionChanged", function(event, rangeStart, rangeEnd){
        financeVolumeChart.onUpdateData(rangeStart, rangeEnd);
    });

    $(FinanceDashboardEventHandler).bind("coinChanged", function(event, coin){
        financeTimeline.onCoinChanged(coin);
    });

    // Set up tooltips for finance notable events
    $('.number-circle').each(function(i, el) {
        var eventId = $(el).text();
        var event = financeEvents[eventId];

        var popupID = "finance-event-popup-" + eventId;
        var popup = "<div class='finance-event-popup' id='" + popupID + "'>" +
            "<p class='popup-title'>" + event.title + "</p>" +
            "<em><p class='popup-date'>" + event.keyDate + "</p></em>" +
            "<p>" + event.content + "</p>" +
            "</div>";
        $('.finance-events').append(popup);

        tippy(document.querySelector("#f-popup-" + eventId), {
            content: document.querySelector('#' + popupID),
            hideOnClick: false
        });
    });

    $('.number-circle').on('click', function() {
        var eventId = $(this).text();
        // financeEvents is in helpers.js
        var event = financeEvents[eventId];
        var dateParser = d3.timeParse("%m %d, %Y");

        financeTimeline.updateCoin(event.coin);
        financeTimeline.updateView("detailed");
        financeTimeline.updateDetailedWithDates(dateParser(event.dates[0]), dateParser(event.dates[1]));

        financeVolumeChart.onUpdateView(event.volumeType);

        // highlight event as clicked
        $('.number-circle').removeClass('active');
        $(this).addClass('active');
    });

    /** Dashboard 3 **/
    var globe = new dragGlobe("choropleth", mapTopJson, worldTsv, data1, data2, data3);

    /* Clean data */
    // Cleaned in Excel.

  /*  queue()
        .defer(d3.json,"data/world-110m.json")
        .defer(d3.tsv, "data/world-110m-country-names.tsv")
        .defer(d3.csv, "data/attitude.csv")
        .defer(d3.csv, "data/legality.csv")
        .defer(d3.csv, "data/cryptoPercent.csv")
        .await(function(error, mapTopJson, worldTsv, data1, data2, data3) {
            //var regChoropleth = new Choropleth("choropleth", data1, data2, mapTopJson);
           // var dragGlobe = new animatedGlobe("choropleth", data1, data2, "data/countries.geo.json");
            var globe = new dragGlobe("choropleth", mapTopJson, worldTsv, data1, data2, data3);
        });
*/
    /* Create visualization instances */



    /* Bind event handlers */

    //Extra visualizations
    var cChart = new BarChart("crimeChart", crimeData);

    /* Miscellaneous */

    // Fancy typer at start
    $('.typewriter').typed({
        strings: [
            "<p>In 2008, the world reckoned with the coming of Bitcoin and the global introduction of cryptocurrency.</p><p>In 2018, it's hard to imagine a world without it.</p>"
        ],
        typeSpeed: 0,
        contentType: 'html',
        loop: false
    });

    // Block hash generators
    var hashBlockData = [];
    var hashBlockIndex = 0;
    $('.section-divider').each(function() {
        var el = $(this);

        var hashStatus = getBlockStatus();
        var dividerLine = getSectionDividerLine();
        var hashBlock = getHashTable();

        el.append(hashStatus);
        el.append(dividerLine);
        el.append(hashBlock);

        var id = 'hash-block-' + hashBlockIndex;
        el.attr('id', id);
        hashBlockIndex += 1;

        hashBlockData.push({
            id: id,
            heightTop: el.offset().top,
            hit: false
        });
    });

    var windowHeight = $(window).height();
    $(window).scroll(function() {
        triggerHashes($(this).scrollTop(), windowHeight);

        $('.fadeMe').each(function(){
            var pos = $(this).offset().top;
            var height = $(this).height();
            var winTop = $(window).scrollTop();
            var winHeight = $(window).height();

                if (pos > winTop + winHeight) {
                  $(this).removeClass("fadeAni").addClass("fadeMe");
                } else {
                  $(this).addClass("fadeAni").removeClass("fadeMe");
                }
        });
        $('.fadeMeR').each(function(){
            var pos = $(this).offset().top;
            var height = $(this).height();
            var winTop = $(window).scrollTop();
            var winHeight = $(window).height();

                if (pos > winTop + winHeight) {
                  $(this).removeClass("fadeAniR").addClass("fadeMeR");
                } else {
                  $(this).addClass("fadeAniR").removeClass("fadeMeR");
                }
        });
    });

    // Start hashes which are on or before the portion of the page you've hit on reload
    // Scroll won't trigger hashes when you first load page
    triggerHashes($(document).scrollTop(), windowHeight);

    function triggerHashes(scrollTop, windowHeight) {
        for (var i = 0; i < hashBlockData.length; ++i) {
            var hashBlock = hashBlockData[i];
            var hT = hashBlock.heightTop,
                hit = hashBlock.hit,
                id = hashBlock.id;

            if ((scrollTop > (hT - windowHeight + 50)) && !hit){
                setHashTimeout(id);
                hashBlockData[i].hit = true;
            }
        }
    }

    function setHashTimeout(id) {
        var totalHashes = 25;
        setDeceleratingTimeout(function() {
            var el = $('#' + id);
            el.find('.block-hash').text(getHash());
            el.find('.block-nonce').text(getHexadecimal());
            el.find('.block-bits').text(getHexadecimal());
        }, 10, totalHashes);

        var statusStrings = [
            "Generating cryptographic nonce...",
            "Aggregating transactions...",
            "Found a new block!"
        ];
        var curStatus = 0;
        setDeceleratingTimeout(function() {
            var el = $('#' + id);
            el.find('.block-status').text(statusStrings[curStatus]);
            curStatus += 1;

            if (curStatus === statusStrings.length) {
                setTimeout(function() {
                    el.find('.block-status').animate({ opacity: 0 });
                }, 1000);
            }
        }, 1000, statusStrings.length);

        // Takes about 5 secs to find block
        var timeToFindBlock = 5000;
        setTimeout(function() {
            var el = $('#' + id);
            el.find('.divider-line').animate({ height: '100px' });

            el.next().addClass('active');
        }, timeToFindBlock)
    }

    function getHash() {
        return faker.finance.bitcoinAddress();
    }

    function getHexadecimal() {
        var max = 10000000000;
        var min = 100000000;
        var num = Math.floor(Math.random() * (max - min + 1)) + min;
        return '0x' + num.toString(16);
    }

    function setDeceleratingTimeout(callback, factor, times)
    {
        var internalCallback = function(tick, counter) {
            return function() {
                if (--tick >= 0) {
                    window.setTimeout(internalCallback, ++counter * factor);
                    callback();
                }
            }
        }(times, 0);

        window.setTimeout(internalCallback, factor);
    }

    function getBlockStatus() {
        return "<div class='block-status'>Computing block hash...</div>";
    }

    function getSectionDividerLine() {
        return "<div class='divider-line-wrapper'>" +
                    "<div class='divider-line'></div>" +
                "</div>";
    }

    function getHashTable() {
        return "<div class='hash-block'>" +
                "<table class='hash-table'>" +
                    "<tr>" +
                        "<td class='block-data-title'>blockhash</td>" +
                        "<td class='block-data-value block-hash'></td>" +
                    "</tr>" +
                    "<tr>" +
                        "<td class='block-data-title'>nonce</td>" +
                        "<td class='block-data-value block-nonce'></td>" +
                    "</tr>" +
                    "<tr>" +
                        "<td class='block-data-title'>bits</td>" +
                        "<td class='block-data-value block-bits'></td>" +
                    "</tr>" +
                "</table>" +
            "</div>";
    }
}
