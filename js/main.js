// Coin colors
var coinColorScale = d3.scaleOrdinal(d3.schemeCategory20);

/* Load data */
queue()
    .defer(d3.text, "data/cryptoFinancialData.csv")
    .defer(d3.csv, "data/crime.csv")
    .defer(d3.json, "data/coinTree.json")
    .defer(d3.csv, "data/txSpeed.csv")
    .await(createVis);

function createVis(error, financialData, crimeData, coinTreeJSON, txData) {
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
    var chart = bubbleChart().width(600).height(400).showTitleOnCircle(true);
    d3.select("#txChart").datum(txData).call(chart);
    /*** Create dashboards ***/

    /** Dashboard 1 **/

    // Clean Data
    var treeDateParse = d3.timeParse('%m-%Y')

    var coinTreeData = Object.keys(coinTreeJSON).map(function(key) {
        return [treeDateParse(key), coinTreeJSON[key]];
    });
    coinTreeData.sort(function(a, b) {
        return a[0] - b[0];
    });

    // Create visualization instances
    var familyTree = new FamilyTree("family-tree", coinTreeData)

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
    });

    /** Dashboard 3 **/

    /* Clean data */
    // Cleaned in Excel.
    /* Create visualization instances */



    /* Bind event handlers */

    //Extra vizualiazations
    var cChart = new BarChart("crimeChart", crimeData);
}
